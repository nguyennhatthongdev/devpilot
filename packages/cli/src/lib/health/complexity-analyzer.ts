import { readFile } from 'fs/promises';
import { ComplexityMetrics } from './types.js';

// Heuristic complexity analysis — counts branching keywords as proxy for cyclomatic complexity
// Avoids heavy AST parsers for MVP; accurate enough for JS/TS
const BRANCH_KEYWORDS = /\b(if|else|for|while|do|switch|case|catch|&&|\|\||\?)\b/g;

export class ComplexityAnalyzer {
  private threshold = 10;

  async analyze(files: string[]): Promise<ComplexityMetrics> {
    const complexities: number[] = [];
    const complexFiles: Array<{ file: string; complexity: number }> = [];

    for (const file of files) {
      if (!this.isCodeFile(file)) continue;

      try {
        const content = await readFile(file, 'utf-8');
        const matches = content.match(BRANCH_KEYWORDS);
        const lines = content.split('\n').length;
        // Normalize: branching keywords per 100 lines
        const complexity = lines > 0 ? Math.round(((matches?.length ?? 0) / lines) * 100 * 10) / 10 : 0;
        complexities.push(complexity);

        if (complexity > this.threshold) {
          complexFiles.push({ file, complexity });
        }
      } catch {
        // Skip unreadable files
      }
    }

    const avg = complexities.length > 0
      ? Math.round((complexities.reduce((a, b) => a + b, 0) / complexities.length) * 10) / 10
      : 0;
    const max = complexities.length > 0 ? Math.max(...complexities) : 0;

    // Score: lower complexity = higher score
    let score = 100;
    if (avg > 20) score = 20;
    else if (avg > 15) score = 40;
    else if (avg > 10) score = 60;
    else if (avg > 5) score = 80;

    return {
      score,
      avgCyclomaticComplexity: avg,
      filesOverThreshold: complexFiles.length,
      maxComplexity: Math.round(max),
      complexFiles: complexFiles.sort((a, b) => b.complexity - a.complexity).slice(0, 5),
    };
  }

  private isCodeFile(file: string): boolean {
    return /\.(ts|tsx|js|jsx)$/.test(file);
  }
}
