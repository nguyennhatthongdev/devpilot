import { BaseAnalyzer } from './base-analyzer.js';
import { DocCoverageMetrics } from './types.js';
import { detectLanguage } from './language-config.js';

export class DocCoverageAnalyzer extends BaseAnalyzer<DocCoverageMetrics> {
  async analyze(files: string[], _rootPath: string): Promise<DocCoverageMetrics> {
    let publicFunctions = 0;
    let documented = 0;
    const undocumented = new Map<string, number>();

    for (const file of this.filterCodeFiles(files)) {
      const lang = detectLanguage(file);
      if (!lang) continue;

      const content = await this.readFileSafe(file);
      if (!content) continue;

      const result = this.analyzeFile(content, lang);
      publicFunctions += result.total;
      documented += result.docs;

      const missing = result.total - result.docs;
      if (missing > 0) undocumented.set(file, missing);
    }

    const coverage = publicFunctions > 0 ? (documented / publicFunctions) * 100 : 100;
    const score = Math.round(coverage);

    const undocumentedFiles = Array.from(undocumented.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, missing]) => ({ file, missing }));

    return { score, publicFunctions, documented, coverage, undocumentedFiles };
  }

  private analyzeFile(content: string, lang: string): { total: number; docs: number } {
    let total = 0;
    let docs = 0;

    if (lang === 'javascript') {
      // Match: export function/class
      const fns = content.matchAll(/export\s+(?:async\s+)?(?:function|class)\s+[a-zA-Z_$]/g);
      for (const match of fns) {
        total++;
        const idx = match.index!;
        const before = content.slice(Math.max(0, idx - 300), idx);
        if (/\/\*\*[\s\S]*?\*\/\s*$/.test(before)) docs++;
      }
    } else if (lang === 'python') {
      // Match: def function (not starting with _)
      const fns = content.matchAll(/^def\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(/gm);
      for (const match of fns) {
        if (match[1].startsWith('_')) continue;
        total++;
        const idx = match.index! + match[0].length;
        const after = content.slice(idx, idx + 200);
        if (/^\s*[^:]*:\s*\n\s*("""|''')/.test(after) || /^[^:]*:\s*("""|''')/.test(after)) docs++;
      }
    } else if (lang === 'go') {
      // Go: exported functions start with uppercase, doc comment is // FuncName
      const fns = content.matchAll(/^func\s+(?:\([^)]+\)\s+)?([A-Z][a-zA-Z0-9]*)\s*\(/gm);
      for (const match of fns) {
        total++;
        const idx = match.index!;
        const before = content.slice(Math.max(0, idx - 200), idx);
        if (/\/\/\s*\S+.*\n\s*$/.test(before)) docs++;
      }
    } else if (lang === 'rust') {
      // Rust: pub fn, doc comments start with ///
      const fns = content.matchAll(/pub\s+(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
      for (const match of fns) {
        total++;
        const idx = match.index!;
        const before = content.slice(Math.max(0, idx - 200), idx);
        if (/\/\/\/\s*\S+.*\n\s*$/.test(before)) docs++;
      }
    } else if (lang === 'java') {
      // Java: public methods/classes, Javadoc /** */
      const fns = content.matchAll(/public\s+(?:static\s+)?(?:void|int|String|boolean|[A-Z]\w*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
      for (const match of fns) {
        total++;
        const idx = match.index!;
        const before = content.slice(Math.max(0, idx - 300), idx);
        if (/\/\*\*[\s\S]*?\*\/\s*$/.test(before)) docs++;
      }
    }

    return { total, docs };
  }
}
