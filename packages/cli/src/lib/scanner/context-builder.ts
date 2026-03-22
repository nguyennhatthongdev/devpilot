import { dirname, extname, relative } from 'path';
import { FileWalker } from './file-walker.js';
import { ContextData, FileStats, TechStack } from './types.js';

const EXT_LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript',
  py: 'python', go: 'go', rs: 'rust',
  java: 'java', swift: 'swift', kt: 'kotlin',
  md: 'markdown', json: 'json', yaml: 'yaml', yml: 'yaml',
  css: 'css', scss: 'scss', html: 'html',
};

const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs',
  'java', 'swift', 'kt', 'css', 'scss', 'html',
]);

export class ContextBuilder {
  private walker = new FileWalker();

  async build(
    files: string[],
    rootPath: string,
    techStack: TechStack,
    dependencies: { runtime: Record<string, string>; dev: Record<string, string> },
    excludePatterns: string[],
  ): Promise<ContextData> {
    const languages: Record<string, FileStats> = {};
    const largestFiles: Array<{ path: string; lines: number; size: number }> = [];
    const directories = new Set<string>();
    let totalFiles = 0;
    let totalLines = 0;

    for (const file of files) {
      const ext = extname(file).slice(1) || 'no-extension';
      const lang = EXT_LANGUAGE_MAP[ext] || ext;

      if (!languages[lang]) languages[lang] = { files: 0, lines: 0 };
      languages[lang].files++;
      totalFiles++;

      // Track parent directories
      directories.add(dirname(relative(rootPath, file)));

      // Count lines only for code files
      if (CODE_EXTENSIONS.has(ext)) {
        const lines = await this.walker.countLines(file);
        const size = await this.walker.getFileSize(file);
        languages[lang].lines += lines;
        totalLines += lines;
        largestFiles.push({ path: relative(rootPath, file), lines, size });
      }
    }

    // Sort and keep top 10 largest
    largestFiles.sort((a, b) => b.lines - a.lines);

    return {
      scannedAt: new Date().toISOString(),
      projectRoot: rootPath,
      stats: { totalFiles, totalLines, languages },
      techStack,
      dependencies,
      fileStructure: {
        directories: directories.size,
        largestFiles: largestFiles.slice(0, 10),
      },
      excludePatterns,
    };
  }
}
