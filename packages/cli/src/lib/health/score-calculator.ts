import { readFile } from 'fs/promises';
import { join } from 'path';
import YAML from 'yaml';
import { HealthScore, FileSizeMetrics, TestCoverageMetrics, SecurityMetrics } from './types.js';

// Original 6 metrics keep ~12-15% each, new 5 analyzers get ~4-6% each
// Total = 0.76 (original) + 0.24 (new) = 1.00
const WEIGHTS: Record<string, number> = {
  complexity: 0.16,
  duplication: 0.13,
  dependencies: 0.13,
  fileSize: 0.13,
  testCoverage: 0.16,
  security: 0.13,
  // Phase 3 analyzers
  styleConsistency: 0.04,
  deadCode: 0.05,
  todos: 0.03,
  docCoverage: 0.04,
  importCycles: 0.04, // sum = 1.04 -> gets normalized
};

export class ScoreCalculator {
  calculateOverallScore(
    breakdown: HealthScore['breakdown'],
    testCoverage?: TestCoverageMetrics,
    security?: SecurityMetrics,
  ): number {
    const activeMetrics: Array<{ score: number; weight: number }> = [
      { score: breakdown.complexity.score, weight: WEIGHTS.complexity },
      { score: breakdown.duplication.score, weight: WEIGHTS.duplication },
      { score: breakdown.dependencies.score, weight: WEIGHTS.dependencies },
      { score: breakdown.fileSize.score, weight: WEIGHTS.fileSize },
    ];

    if (testCoverage) {
      activeMetrics.push({ score: this.calculateTestCoverageScore(testCoverage), weight: WEIGHTS.testCoverage });
    }
    if (security) {
      activeMetrics.push({ score: this.calculateSecurityScore(security), weight: WEIGHTS.security });
    }

    // Phase 3 analyzers (optional — only scored when present)
    if (breakdown.styleConsistency) {
      activeMetrics.push({ score: breakdown.styleConsistency.score, weight: WEIGHTS.styleConsistency });
    }
    if (breakdown.deadCode) {
      activeMetrics.push({ score: breakdown.deadCode.score, weight: WEIGHTS.deadCode });
    }
    if (breakdown.todos) {
      activeMetrics.push({ score: breakdown.todos.score, weight: WEIGHTS.todos });
    }
    if (breakdown.docCoverage) {
      activeMetrics.push({ score: breakdown.docCoverage.score, weight: WEIGHTS.docCoverage });
    }
    if (breakdown.importCycles) {
      activeMetrics.push({ score: breakdown.importCycles.score, weight: WEIGHTS.importCycles });
    }

    // Weighted sum: normalize active weights to 1.0, then sum(score * weight/totalWeight)
    // When optional metrics are absent, remaining weights redistribute proportionally
    const totalWeight = activeMetrics.reduce((sum, m) => sum + m.weight, 0);
    const weightedSum = activeMetrics.reduce((sum, m) => sum + (m.score * m.weight / totalWeight), 0);

    return Math.round(weightedSum);
  }

  private calculateTestCoverageScore(metrics: TestCoverageMetrics): number {
    // Exclude branches from avg when data unavailable (branchesFound=0 in LCOV)
    const values = [metrics.lines, metrics.statements, metrics.functions];
    if (!metrics.branchesUnavailable) values.push(metrics.branches);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(avg);
  }

  private calculateSecurityScore(metrics: SecurityMetrics): number {
    const deductions =
      metrics.vulnerabilities.critical * 20 +
      metrics.vulnerabilities.high * 10 +
      metrics.vulnerabilities.moderate * 5 +
      metrics.vulnerabilities.low * 2 +
      metrics.vulnerabilities.info * 1;
    return Math.max(0, 100 - deductions);
  }

  async calculateTrend(
    currentScore: number,
    rootPath: string,
  ): Promise<'improving' | 'stable' | 'declining' | undefined> {
    try {
      const healthPath = join(rootPath, '.devpilot', 'local', 'health.yaml');
      const prev = YAML.parse(await readFile(healthPath, 'utf-8'));
      const diff = currentScore - prev.overallScore;
      if (diff > 5) return 'improving';
      if (diff < -5) return 'declining';
      return 'stable';
    } catch {
      return undefined;
    }
  }

  calculateFileSizeScore(largestFiles: Array<{ path: string; lines: number }>): FileSizeMetrics {
    if (largestFiles.length === 0) {
      return { score: 100, avgSize: 0, largeFiles: 0, largeFilesList: [] };
    }

    const lineCounts = largestFiles.map(f => f.lines);
    const avgSize = Math.round(lineCounts.reduce((a, b) => a + b, 0) / lineCounts.length);
    const large = largestFiles.filter(f => f.lines > 500);
    const largePct = (large.length / largestFiles.length) * 100;

    let score = 100;
    if (largePct > 30) score = 60;
    else if (largePct > 20) score = 75;
    else if (largePct > 10) score = 85;

    return {
      score,
      avgSize,
      largeFiles: large.length,
      largeFilesList: large.slice(0, 5).map(f => ({ file: f.path, lines: f.lines })),
    };
  }
}
