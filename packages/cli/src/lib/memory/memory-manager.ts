import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Decision, Pattern, MemoryFilter } from './types.js';
import { parseDecisions, serializeDecisions, parsePatterns, serializePatterns } from './markdown-parser.js';

export class MemoryManager {
  private memoryDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.memoryDir = join(projectRoot, '.devpilot', 'shared', 'memory');
  }

  async addDecision(decision: Omit<Decision, 'id' | 'usageCount' | 'lastUsed'>): Promise<void> {
    const decisions = await this.getDecisions();
    const newDecision: Decision = {
      ...decision,
      id: `dec-${String(decisions.length + 1).padStart(3, '0')}`,
      usageCount: 0,
      lastUsed: new Date().toISOString(),
    };
    decisions.push(newDecision);
    await this.saveDecisions(decisions);
  }

  async addPattern(pattern: Omit<Pattern, 'id' | 'usageCount' | 'lastUsed'>): Promise<void> {
    const patterns = await this.getPatterns();
    const newPattern: Pattern = {
      ...pattern,
      id: `pat-${String(patterns.length + 1).padStart(3, '0')}`,
      usageCount: 0,
      lastUsed: new Date().toISOString(),
    };
    patterns.push(newPattern);
    await this.savePatterns(patterns);
  }

  async getDecisions(filter?: MemoryFilter): Promise<Decision[]> {
    try {
      const content = await readFile(join(this.memoryDir, 'decisions.md'), 'utf-8');
      let decisions: Decision[] = parseDecisions(content);

      if (filter?.tags) {
        decisions = decisions.filter(d => d.tags.some(tag => filter.tags!.includes(tag)));
      }
      if (filter?.minUsageCount) {
        decisions = decisions.filter(d => d.usageCount >= filter.minUsageCount!);
      }
      if (filter?.since) {
        decisions = decisions.filter(d => new Date(d.date) >= filter.since!);
      }
      return decisions;
    } catch {
      return [];
    }
  }

  async getPatterns(filter?: MemoryFilter): Promise<Pattern[]> {
    try {
      const content = await readFile(join(this.memoryDir, 'patterns.md'), 'utf-8');
      let patterns: Pattern[] = parsePatterns(content);

      if (filter?.tags) {
        patterns = patterns.filter(p => p.tags.some(tag => filter.tags!.includes(tag)));
      }
      if (filter?.minUsageCount) {
        patterns = patterns.filter(p => p.usageCount >= filter.minUsageCount!);
      }
      return patterns;
    } catch {
      return [];
    }
  }

  async pruneMemories(strategy: 'time' | 'usage'): Promise<number> {
    let decisions = await this.getDecisions();
    let patterns = await this.getPatterns();
    const originalCount = decisions.length + patterns.length;

    if (strategy === 'time') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      decisions = decisions.filter(d => new Date(d.lastUsed) >= cutoff);
      patterns = patterns.filter(p => new Date(p.lastUsed) >= cutoff);
    } else if (strategy === 'usage') {
      decisions = decisions.filter(d => d.usageCount > 0);
      patterns = patterns.filter(p => p.usageCount > 0);
    }

    await this.saveDecisions(decisions);
    await this.savePatterns(patterns);
    return originalCount - (decisions.length + patterns.length);
  }

  async buildMemoryContext(maxTokens: number = 10000): Promise<string> {
    const decisions = await this.getDecisions();
    const patterns = await this.getPatterns();

    // Sort by usage (most used first)
    decisions.sort((a, b) => b.usageCount - a.usageCount);
    patterns.sort((a, b) => b.usageCount - a.usageCount);

    let context = '# Project Memory\n\n## Architecture Decisions\n';
    for (const dec of decisions.slice(0, 10)) {
      context += `- **${dec.title}**: ${dec.decision}. ${dec.rationale}\n`;
    }

    context += '\n## Coding Patterns\n';
    for (const pat of patterns.slice(0, 10)) {
      context += `- ${pat.pattern}\n`;
      if (pat.examples[0]?.good) {
        context += `  - Example: ${pat.examples[0].good}\n`;
      }
    }

    return context;
  }

  private async saveDecisions(decisions: Decision[]): Promise<void> {
    await mkdir(this.memoryDir, { recursive: true });
    await writeFile(join(this.memoryDir, 'decisions.md'), serializeDecisions(decisions));
  }

  private async savePatterns(patterns: Pattern[]): Promise<void> {
    await mkdir(this.memoryDir, { recursive: true });
    await writeFile(join(this.memoryDir, 'patterns.md'), serializePatterns(patterns));
  }
}
