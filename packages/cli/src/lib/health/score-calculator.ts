import { readFile } from 'fs/promises';
import { join } from 'path';
import YAML from 'yaml';
import { HealthScore, FileSizeMetrics } from './types.js';

const WEIGHTS = {
  complexity: 0.30,
  duplication: 0.25,
  dependencies: 0.20,
  fileSize: 0.15,
  // Remaining 0.10 reserved for future metrics
};

export class ScoreCalculator {
  calculateOverallScore(breakdown: HealthScore['breakdown']): number {
    const weighted =
      breakdown.complexity.score * WEIGHTS.complexity +
      breakdown.duplication.score * WEIGHTS.duplication +
      breakdown.dependencies.score * WEIGHTS.dependencies +
      breakdown.fileSize.score * WEIGHTS.fileSize;

    // Normalize remaining weight
    const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    return Math.round(weighted / totalWeight);
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
      return undefined; // First run
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
