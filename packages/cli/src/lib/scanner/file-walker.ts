import { fdir } from 'fdir';
import { readFile, stat } from 'fs/promises';

export class FileWalker {
  async walk(rootPath: string, maxDepth: number = 10): Promise<string[]> {
    const api = new fdir()
      .withFullPaths()
      .withMaxDepth(maxDepth)
      .crawl(rootPath);

    return api.withPromise();
  }

  async countLines(filePath: string): Promise<number> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return content.split('\n').length;
    } catch {
      return 0;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}
