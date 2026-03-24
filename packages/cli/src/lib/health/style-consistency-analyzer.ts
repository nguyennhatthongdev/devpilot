import { BaseAnalyzer } from './base-analyzer.js';
import { StyleConsistencyMetrics } from './types.js';
import { detectLanguage } from './language-config.js';

// Match identifiers in variable/function/class declarations
const DECL_PATTERN = /(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
// Note: used via matchAll() which creates a copy, so module-level /g is safe

export class StyleConsistencyAnalyzer extends BaseAnalyzer<StyleConsistencyMetrics> {
  async analyze(files: string[], _rootPath: string): Promise<StyleConsistencyMetrics> {
    const distribution = { camelCase: 0, snake_case: 0, PascalCase: 0 };
    const inconsistentFiles: Array<{ file: string; styles: string[] }> = [];

    for (const file of this.filterCodeFiles(files)) {
      if (!detectLanguage(file)) continue;

      const content = await this.readFileSafe(file);
      if (!content) continue;

      const fileStyles = new Set<string>();
      const identifiers = this.extractIdentifiers(content);

      for (const id of identifiers) {
        const style = this.classifyStyle(id);
        if (style) {
          distribution[style]++;
          fileStyles.add(style);
        }
      }

      if (fileStyles.size > 1) {
        inconsistentFiles.push({ file, styles: Array.from(fileStyles) });
      }
    }

    const total = distribution.camelCase + distribution.snake_case + distribution.PascalCase;
    const entries = Object.entries(distribution) as Array<[keyof typeof distribution, number]>;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0][0];
    const dominantPct = total > 0 ? (sorted[0][1] / total) * 100 : 100;

    const score = Math.round(Math.min(100, dominantPct));

    return {
      score,
      dominantStyle: inconsistentFiles.length > files.length * 0.3 ? 'mixed' : dominant,
      styleDistribution: distribution,
      inconsistentFiles: inconsistentFiles.slice(0, 10),
    };
  }

  private extractIdentifiers(content: string): string[] {
    // Remove comments and strings first
    const cleaned = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '');

    const ids: string[] = [];
    for (const match of cleaned.matchAll(DECL_PATTERN)) {
      ids.push(match[1]);
    }
    return ids;
  }

  private classifyStyle(id: string): keyof StyleConsistencyMetrics['styleDistribution'] | null {
    if (id.length < 2) return null;
    // Skip ALL_CAPS constants
    if (/^[A-Z][A-Z0-9_]+$/.test(id)) return null;
    if (/^[A-Z][a-zA-Z0-9]*$/.test(id)) return 'PascalCase';
    if (/^[a-z][a-zA-Z0-9]*$/.test(id) && /[A-Z]/.test(id)) return 'camelCase';
    if (/^[a-z][a-z0-9_]*$/.test(id) && id.includes('_')) return 'snake_case';
    // Single-word lowercase - ambiguous, skip
    return null;
  }
}
