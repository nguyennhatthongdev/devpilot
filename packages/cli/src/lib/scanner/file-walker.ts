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

  private static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  async countLines(filePath: string): Promise<number> {
    try {
      const stats = await stat(filePath);
      if (stats.size > FileWalker.MAX_FILE_SIZE) return 0;
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
