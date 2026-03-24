import { BaseAnalyzer } from './base-analyzer.js';
import { DeadCodeMetrics } from './types.js';
import { detectLanguage } from './language-config.js';

export class DeadCodeDetector extends BaseAnalyzer<DeadCodeMetrics> {
  private entryPoints = ['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js'];

  async analyze(files: string[], _rootPath: string): Promise<DeadCodeMetrics> {
    const codeFiles = files.filter(f => detectLanguage(f));
    const exports = new Map<string, { file: string; type: string }>();
    const imports = new Set<string>();

    // Phase 1: Collect all exports (skip entry points)
    for (const file of codeFiles) {
      if (this.isEntryPoint(file)) continue;

      const content = await this.readFileSafe(file);
      if (!content) continue;

      // Skip type-only exports
      for (const [name, type] of this.extractExports(content)) {
        exports.set(`${file}::${name}`, { file, type });
      }
    }

    // Phase 2: Collect all imports
    for (const file of codeFiles) {
      const content = await this.readFileSafe(file);
      if (!content) continue;

      for (const name of this.extractImports(content)) {
        imports.add(name);
      }
    }

    // Phase 3: Find unused exports (conservative - name match only)
    const unused: DeadCodeMetrics['details'] = [];
    for (const [key, { file, type }] of exports) {
      const name = key.split('::')[1];
      if (!imports.has(name)) {
        unused.push({ file, export: name, type: type as any });
      }
    }

    const score = exports.size > 0
      ? Math.round((1 - unused.length / exports.size) * 100)
      : 100;

    return {
      score,
      unusedExports: unused.length,
      unusedFiles: new Set(unused.map(u => u.file)).size,
      details: unused.slice(0, 20),
    };
  }

  private extractExports(content: string): Map<string, string> {
    const result = new Map<string, string>();

    // export function/class/const/let/var (skip export type)
    const named = content.matchAll(/export\s+(?!type\s)(function|class|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    for (const m of named) result.set(m[2], m[1]);

    // export { name1, name2 } (skip export type {})
    const braced = content.matchAll(/export\s+(?!type\s)\{\s*([^}]+)\s*\}/g);
    for (const m of braced) {
      const names = m[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim());
      for (const n of names) {
        if (n && !n.startsWith('type ')) result.set(n, 'unknown');
      }
    }

    // export default — skip, hard to track by name
    return result;
  }

  private extractImports(content: string): string[] {
    const result: string[] = [];

    // import { name1, name2 } from '...' (including type imports since they reference)
    const braced = content.matchAll(/import\s.*?\{([^}]+)\}\s*from/g);
    for (const m of braced) {
      const names = m[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, '').trim());
      result.push(...names.filter(Boolean));
    }

    // import Name from '...'
    const defaults = content.matchAll(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from/g);
    for (const m of defaults) result.push(m[1]);

    return result;
  }

  private isEntryPoint(file: string): boolean {
    return this.entryPoints.some(ep => file.endsWith(ep));
  }
}
