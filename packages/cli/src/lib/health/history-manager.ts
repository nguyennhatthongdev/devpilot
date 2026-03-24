import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import YAML from 'yaml';
import { HealthScore, SecurityMetrics } from './types.js';

const execAsync = promisify(exec);

export interface HistoryEntry {
  timestamp: string;
  score: number;
  metrics: {
    complexity: number;
    duplication: number;
    dependencies: number;
    fileSize: number;
    testCoverage?: number;
    security?: number;
  };
  gitSha?: string;
}

export class HealthHistoryManager {
  private maxEntries = 50;

  async saveHistory(score: HealthScore, rootPath: string): Promise<void> {
    const historyPath = join(rootPath, '.devpilot', 'local', 'health-history.yaml');
    let entries: HistoryEntry[] = [];

    try {
      const content = await readFile(historyPath, 'utf-8');
      const parsed = YAML.parse(content);
      entries = parsed?.history || [];
    } catch {
      // No existing history
    }

    const gitSha = await this.getGitSha(rootPath);

    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      score: score.overallScore,
      metrics: {
        complexity: score.breakdown.complexity.score,
        duplication: score.breakdown.duplication.score,
        dependencies: score.breakdown.dependencies.score,
        fileSize: score.breakdown.fileSize.score,
        testCoverage: score.testCoverage
          ? this.calcCoverageAvg(score.testCoverage)
          : undefined,
        security: score.security
          ? this.calcSecurityScore(score.security)
          : undefined,
      },
      gitSha,
    };

    entries.unshift(entry);
    entries = entries.slice(0, this.maxEntries);

    await mkdir(join(rootPath, '.devpilot', 'local'), { recursive: true });
    await writeFile(historyPath, YAML.stringify({ history: entries }));
  }

  async loadHistory(rootPath: string): Promise<HistoryEntry[]> {
    try {
      const historyPath = join(rootPath, '.devpilot', 'local', 'health-history.yaml');
      const content = await readFile(historyPath, 'utf-8');
      const parsed = YAML.parse(content);
      return parsed?.history || [];
    } catch {
      return [];
    }
  }

  getTrend(history: HistoryEntry[]): 'improving' | 'stable' | 'declining' | undefined {
    if (history.length < 2) return undefined;

    const recent = history.slice(0, Math.min(7, history.length));
    const scores = recent.map(h => h.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const current = scores[0];

    if (current > avg + 5) return 'improving';
    if (current < avg - 5) return 'declining';
    return 'stable';
  }

  private async getGitSha(rootPath: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git rev-parse --short HEAD', {
        cwd: rootPath, timeout: 5000,
      });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  private calcCoverageAvg(tc: HealthScore['testCoverage']): number {
    if (!tc) return 0;
    const values = [tc.lines, tc.statements, tc.functions];
    if (!tc.branchesUnavailable) values.push(tc.branches);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  private calcSecurityScore(sec: SecurityMetrics): number {
    const deductions =
      sec.vulnerabilities.critical * 20 +
      sec.vulnerabilities.high * 10 +
      sec.vulnerabilities.moderate * 5 +
      sec.vulnerabilities.low * 2 +
      sec.vulnerabilities.info * 1;
    return Math.max(0, 100 - deductions);
  }
}
