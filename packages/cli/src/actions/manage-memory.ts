import { MemoryManager } from '../lib/memory/memory-manager.js';
import { TokenCounter } from '../lib/memory/token-counter.js';
import { type Decision, type Pattern } from '../lib/memory/types.js';
import { ActionResult } from './types.js';

export interface DecisionInput {
  date: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  tags: string[];
}

export interface PatternInput {
  pattern: string;
  scope: string;
  autoDetected: boolean;
  examples: Array<{ good?: string; bad?: string }>;
  tags: string[];
}

export interface MemoryListResult {
  decisions: Decision[];
  patterns: Pattern[];
}

export interface TokenCountResult {
  tokenCount: number;
  decisionsCount: number;
  patternsCount: number;
}

export type PruneStrategy = 'time' | 'usage';

export class ManageMemoryAction {
  private memoryManager: MemoryManager;
  private tokenCounter: TokenCounter;

  constructor(rootPath?: string) {
    this.memoryManager = new MemoryManager(rootPath);
    this.tokenCounter = new TokenCounter();
  }

  async list(): Promise<ActionResult<MemoryListResult>> {
    try {
      const decisions = await this.memoryManager.getDecisions();
      const patterns = await this.memoryManager.getPatterns();

      return {
        success: true,
        data: {
          decisions,
          patterns,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list memories',
      };
    }
  }

  async addDecision(data: DecisionInput): Promise<ActionResult<void>> {
    try {
      await this.memoryManager.addDecision(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add decision',
      };
    }
  }

  async addPattern(data: PatternInput): Promise<ActionResult<void>> {
    try {
      await this.memoryManager.addPattern(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add pattern',
      };
    }
  }

  async prune(strategy: PruneStrategy): Promise<ActionResult<{ prunedCount: number }>> {
    try {
      const prunedCount = await this.memoryManager.pruneMemories(strategy);
      return {
        success: true,
        data: { prunedCount },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prune memories',
      };
    }
  }

  async getTokenCount(): Promise<ActionResult<TokenCountResult>> {
    try {
      const decisions = await this.memoryManager.getDecisions();
      const patterns = await this.memoryManager.getPatterns();
      const tokenCount = this.tokenCounter.estimateMemoryTokens(decisions, patterns);

      return {
        success: true,
        data: {
          tokenCount,
          decisionsCount: decisions.length,
          patternsCount: patterns.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to count tokens',
      };
    }
  }
}
