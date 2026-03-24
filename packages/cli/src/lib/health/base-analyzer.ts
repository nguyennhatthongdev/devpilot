import { readFile } from 'fs/promises';

export abstract class BaseAnalyzer<T> {
  abstract analyze(files: string[], rootPath: string): Promise<T>;

  protected async readFileSafe(path: string): Promise<string | null> {
    try { return await readFile(path, 'utf-8'); }
    catch { return null; }
  }

  protected filterCodeFiles(files: string[]): string[] {
    return files.filter(f => !f.includes('node_modules') && !f.includes('.git'));
  }
}
