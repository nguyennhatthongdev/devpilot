import { BaseAnalyzer } from './base-analyzer.js';
import { ImportCycleMetrics } from './types.js';
import { detectLanguage } from './language-config.js';
import { resolve, dirname } from 'path';

export class ImportCycleDetector extends BaseAnalyzer<ImportCycleMetrics> {
  async analyze(files: string[], _rootPath: string): Promise<ImportCycleMetrics> {
    const graph = await this.buildImportGraph(files);
    const cycles = this.detectCycles(graph);
    const score = cycles.length === 0 ? 100 : Math.max(0, 100 - cycles.length * 10);

    return {
      score,
      cycleCount: cycles.length,
      cycles: cycles.slice(0, 5).map(c => ({ path: c, length: c.length })),
    };
  }

  private async buildImportGraph(files: string[]): Promise<Map<string, string[]>> {
    const graph = new Map<string, string[]>();
    const fileSet = new Set(files);

    for (const file of files) {
      if (!detectLanguage(file)) continue;

      const content = await this.readFileSafe(file);
      if (!content) continue;

      const imports = this.extractImportPaths(content, file, fileSet);
      if (imports.length > 0) graph.set(file, imports);
    }

    return graph;
  }

  private extractImportPaths(content: string, currentFile: string, fileSet: Set<string>): string[] {
    const imports: string[] = [];

    // Match: import ... from './path' (skip import type)
    const matches = content.matchAll(/import\s+(?!type\s).*?\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of matches) {
      const importPath = match[1];

      // Skip external packages
      if (!importPath.startsWith('.') && !importPath.startsWith('@/')) continue;

      // Resolve relative path and try common extensions
      const base = resolve(dirname(currentFile), importPath);
      const resolved = this.resolveFile(base, fileSet);
      if (resolved) imports.push(resolved);
    }

    return imports;
  }

  private resolveFile(base: string, fileSet: Set<string>): string | null {
    // Try exact, then with extensions
    if (fileSet.has(base)) return base;

    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];
    for (const ext of extensions) {
      // Remove .js extension mapping (TS projects import with .js but file is .ts)
      const withoutJs = base.replace(/\.js$/, '');
      if (fileSet.has(withoutJs + ext)) return withoutJs + ext;
      if (fileSet.has(base + ext)) return base + ext;
    }

    // Try /index
    for (const ext of extensions) {
      if (fileSet.has(`${base}/index${ext}`)) return `${base}/index${ext}`;
    }

    return null;
  }

  private detectCycles(graph: Map<string, string[]>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      if (visiting.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }
      if (visited.has(node)) return;

      visiting.add(node);
      path.push(node);

      for (const dep of graph.get(node) || []) {
        dfs(dep, [...path]);
      }

      visiting.delete(node);
      visited.add(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) dfs(node, []);
    }

    return cycles;
  }
}
