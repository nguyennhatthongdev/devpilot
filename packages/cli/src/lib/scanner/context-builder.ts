import { dirname, extname, relative, basename } from 'path';
import { FileWalker } from './file-walker.js';
import { ContextData, FileStats, TechStack } from './types.js';

const EXT_LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  py: 'python', pyw: 'python',
  java: 'java', kt: 'kotlin', scala: 'scala',
  go: 'go', rs: 'rust', rb: 'ruby', php: 'php', swift: 'swift',
  cs: 'csharp',
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
  sh: 'shell', bash: 'shell', zsh: 'shell',
  sql: 'sql', r: 'r', R: 'r',
  lua: 'lua', pl: 'perl', pm: 'perl',
  dart: 'dart', groovy: 'groovy',
  ex: 'elixir', exs: 'elixir',
  clj: 'clojure', cljs: 'clojure',
  hs: 'haskell', ml: 'ocaml', mli: 'ocaml',
  md: 'markdown', json: 'json', yaml: 'yaml', yml: 'yaml',
  css: 'css', scss: 'scss', html: 'html',
};

// File-based detection for extensionless config files
const FILENAME_LANGUAGE_MAP: Record<string, string> = {
  Makefile: 'make',
  Dockerfile: 'docker',
  Jenkinsfile: 'groovy',
  Vagrantfile: 'ruby',
  Rakefile: 'ruby',
  Gemfile: 'ruby',
};

const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'pyw',
  'java', 'kt', 'scala',
  'go', 'rs', 'rb', 'php', 'swift',
  'cs', 'c', 'cpp', 'cc', 'cxx', 'h', 'hpp',
  'sh', 'bash', 'zsh',
  'sql', 'r', 'R',
  'lua', 'pl', 'pm',
  'dart', 'groovy',
  'ex', 'exs', 'clj', 'cljs',
  'hs', 'ml', 'mli',
  'css', 'scss', 'html',
]);

// Lock/generated files excluded from LOC counting
const LOCK_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  'Gemfile.lock', 'Cargo.lock', 'composer.lock', 'poetry.lock',
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
    let codeLines = 0;

    for (const file of files) {
      const fileName = basename(file);

      // Skip lock/generated files from LOC counting
      if (LOCK_FILES.has(fileName)) {
        totalFiles++;
        directories.add(dirname(relative(rootPath, file)));
        continue;
      }

      const ext = extname(file).slice(1) || 'no-extension';

      // Detect language from extension or filename
      let lang = EXT_LANGUAGE_MAP[ext];
      if (!lang) {
        lang = FILENAME_LANGUAGE_MAP[fileName];
        // Also check Dockerfile.* pattern
        if (!lang && fileName.startsWith('Dockerfile.')) lang = 'docker';
      }
      lang = lang || ext;

      if (!languages[lang]) languages[lang] = { files: 0, lines: 0 };
      languages[lang].files++;
      totalFiles++;

      directories.add(dirname(relative(rootPath, file)));

      // Count lines for ALL text files
      const lines = await this.walker.countLines(file);
      const size = await this.walker.getFileSize(file);
      languages[lang].lines += lines;
      totalLines += lines;

      // Track code lines separately
      if (CODE_EXTENSIONS.has(ext)) {
        codeLines += lines;
      }

      largestFiles.push({ path: relative(rootPath, file), lines, size });
    }

    // Sort and keep top 10 largest
    largestFiles.sort((a, b) => b.lines - a.lines);

    return {
      scannedAt: new Date().toISOString(),
      projectRoot: rootPath,
      version: '1.0',
      stats: { totalFiles, totalLines, codeLines, languages },
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
