import ignore, { type Ignore } from 'ignore';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class IgnoreFilter {
  private ig: Ignore = ignore();

  async loadIgnoreFile(rootPath: string, fileName: string): Promise<void> {
    try {
      const content = await readFile(join(rootPath, fileName), 'utf-8');
      this.ig.add(content);
    } catch {
      // File doesn't exist, skip
    }
  }

  addPatterns(patterns: string[]): void {
    this.ig.add(patterns);
  }

  filter(files: string[], rootPath: string): string[] {
    const prefix = rootPath.endsWith('/') ? rootPath : rootPath + '/';
    return files.filter(file => {
      const relativePath = file.startsWith(prefix) ? file.slice(prefix.length) : file;
      return !this.ig.ignores(relativePath);
    });
  }
}
