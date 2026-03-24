import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextBuilder } from '../src/lib/scanner/context-builder.js';
import { FileWalker } from '../src/lib/scanner/file-walker.js';

vi.mock('../src/lib/scanner/file-walker.js');

describe('ContextBuilder', () => {
  let builder: ContextBuilder;
  let mockWalker: any;

  beforeEach(() => {
    builder = new ContextBuilder();
    mockWalker = {
      countLines: vi.fn(),
      getFileSize: vi.fn(),
    };
    (builder as any).walker = mockWalker;
  });

  describe('totalLines and codeLines counting', () => {
    it('should count ALL files in totalLines', async () => {
      const files = [
        '/project/src/app.ts',
        '/project/README.md',
        '/project/package.json',
      ];

      mockWalker.countLines.mockResolvedValueOnce(100); // app.ts
      mockWalker.countLines.mockResolvedValueOnce(50);  // README.md
      mockWalker.countLines.mockResolvedValueOnce(20);  // package.json
      mockWalker.getFileSize.mockResolvedValue(1024);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.totalLines).toBe(170); // 100 + 50 + 20
    });

    it('should only count code extensions in codeLines', async () => {
      const files = [
        '/project/src/app.ts',      // code
        '/project/src/util.js',     // code
        '/project/README.md',       // not code
        '/project/package.json',    // not code
      ];

      mockWalker.countLines.mockResolvedValueOnce(100); // app.ts
      mockWalker.countLines.mockResolvedValueOnce(80);  // util.js
      mockWalker.countLines.mockResolvedValueOnce(50);  // README.md
      mockWalker.countLines.mockResolvedValueOnce(20);  // package.json
      mockWalker.getFileSize.mockResolvedValue(1024);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.totalLines).toBe(250); // 100 + 80 + 50 + 20
      expect(result.stats.codeLines).toBe(180);  // 100 + 80 (only .ts and .js)
    });
  });

  describe('language detection', () => {
    it('should detect 30+ languages from EXT_LANGUAGE_MAP', async () => {
      const files = [
        '/project/file.ts',
        '/project/file.tsx',
        '/project/file.js',
        '/project/file.jsx',
        '/project/file.py',
        '/project/file.java',
        '/project/file.kt',
        '/project/file.scala',
        '/project/file.go',
        '/project/file.rs',
        '/project/file.rb',
        '/project/file.php',
        '/project/file.swift',
        '/project/file.cs',
        '/project/file.c',
        '/project/file.cpp',
        '/project/file.sh',
        '/project/file.sql',
        '/project/file.r',
        '/project/file.lua',
        '/project/file.pl',
        '/project/file.dart',
        '/project/file.groovy',
        '/project/file.ex',
        '/project/file.clj',
        '/project/file.hs',
        '/project/file.ml',
        '/project/file.md',
        '/project/file.json',
        '/project/file.yaml',
        '/project/file.css',
        '/project/file.scss',
        '/project/file.html',
      ];

      mockWalker.countLines.mockResolvedValue(10);
      mockWalker.getFileSize.mockResolvedValue(1024);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      const languages = result.stats.languages;

      expect(languages.typescript).toBeDefined();
      expect(languages.javascript).toBeDefined();
      expect(languages.python).toBeDefined();
      expect(languages.java).toBeDefined();
      expect(languages.kotlin).toBeDefined();
      expect(languages.scala).toBeDefined();
      expect(languages.go).toBeDefined();
      expect(languages.rust).toBeDefined();
      expect(languages.ruby).toBeDefined();
      expect(languages.php).toBeDefined();
      expect(languages.swift).toBeDefined();
      expect(languages.csharp).toBeDefined();
      expect(languages.c).toBeDefined();
      expect(languages.cpp).toBeDefined();
      expect(languages.shell).toBeDefined();
      expect(languages.sql).toBeDefined();
      expect(languages.r).toBeDefined();
      expect(languages.lua).toBeDefined();
      expect(languages.perl).toBeDefined();
      expect(languages.dart).toBeDefined();
      expect(languages.groovy).toBeDefined();
      expect(languages.elixir).toBeDefined();
      expect(languages.clojure).toBeDefined();
      expect(languages.haskell).toBeDefined();
      expect(languages.ocaml).toBeDefined();
      expect(languages.markdown).toBeDefined();
      expect(languages.json).toBeDefined();
      expect(languages.yaml).toBeDefined();
      expect(languages.css).toBeDefined();
      expect(languages.scss).toBeDefined();
      expect(languages.html).toBeDefined();
    });

    it('should detect file-based language mapping for Makefile', async () => {
      const files = ['/project/Makefile'];
      mockWalker.countLines.mockResolvedValue(20);
      mockWalker.getFileSize.mockResolvedValue(512);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.languages.make).toBeDefined();
      expect(result.stats.languages.make.files).toBe(1);
      expect(result.stats.languages.make.lines).toBe(20);
    });

    it('should detect file-based language mapping for Dockerfile', async () => {
      const files = ['/project/Dockerfile'];
      mockWalker.countLines.mockResolvedValue(15);
      mockWalker.getFileSize.mockResolvedValue(400);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.languages.docker).toBeDefined();
      expect(result.stats.languages.docker.files).toBe(1);
    });

    it('should detect file-based language mapping for Jenkinsfile', async () => {
      const files = ['/project/Jenkinsfile'];
      mockWalker.countLines.mockResolvedValue(30);
      mockWalker.getFileSize.mockResolvedValue(800);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.languages.groovy).toBeDefined();
      expect(result.stats.languages.groovy.files).toBe(1);
    });

    it('should detect file-based language mapping for Vagrantfile', async () => {
      const files = ['/project/Vagrantfile'];
      mockWalker.countLines.mockResolvedValue(25);
      mockWalker.getFileSize.mockResolvedValue(600);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.languages.ruby).toBeDefined();
      expect(result.stats.languages.ruby.files).toBe(1);
    });

    it('should detect Dockerfile.* pattern as docker', async () => {
      const files = ['/project/Dockerfile.prod'];
      mockWalker.countLines.mockResolvedValue(12);
      mockWalker.getFileSize.mockResolvedValue(300);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.languages.docker).toBeDefined();
      expect(result.stats.languages.docker.files).toBe(1);
    });
  });

  describe('version field', () => {
    it('should set version to "1.0"', async () => {
      const files = ['/project/src/app.ts'];
      mockWalker.countLines.mockResolvedValue(50);
      mockWalker.getFileSize.mockResolvedValue(1024);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.version).toBe('1.0');
    });
  });

  describe('lock files exclusion', () => {
    it('should skip package-lock.json from LOC counting', async () => {
      const files = [
        '/project/src/app.ts',
        '/project/package-lock.json',
      ];

      mockWalker.countLines.mockResolvedValueOnce(100); // app.ts
      mockWalker.getFileSize.mockResolvedValue(1024);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.totalFiles).toBe(2); // Both counted as files
      expect(result.stats.totalLines).toBe(100); // Only app.ts lines counted
      expect(mockWalker.countLines).toHaveBeenCalledTimes(1); // Only called for app.ts
    });

    it('should skip multiple lock files from LOC counting', async () => {
      const files = [
        '/project/src/app.ts',
        '/project/package-lock.json',
        '/project/yarn.lock',
        '/project/Cargo.lock',
      ];

      mockWalker.countLines.mockResolvedValueOnce(100); // app.ts only
      mockWalker.getFileSize.mockResolvedValue(1024);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.stats.totalFiles).toBe(4); // All counted
      expect(result.stats.totalLines).toBe(100); // Only app.ts
      expect(mockWalker.countLines).toHaveBeenCalledTimes(1);
    });
  });

  describe('metadata fields', () => {
    it('should populate all required fields correctly', async () => {
      const files = ['/project/src/app.ts'];
      mockWalker.countLines.mockResolvedValue(50);
      mockWalker.getFileSize.mockResolvedValue(2048);

      const techStack = {
        frameworks: ['express'],
        language: 'typescript',
        packageManager: 'npm',
      };

      const dependencies = {
        runtime: { express: '^4.18.0' },
        dev: { vitest: '^1.0.0' },
      };

      const result = await builder.build(files, '/project', techStack, dependencies, ['node_modules']);

      expect(result.projectRoot).toBe('/project');
      expect(result.version).toBe('1.0');
      expect(result.techStack).toEqual(techStack);
      expect(result.dependencies).toEqual(dependencies);
      expect(result.excludePatterns).toEqual(['node_modules']);
      expect(result.scannedAt).toBeDefined();
      expect(result.fileStructure.directories).toBeGreaterThanOrEqual(1);
      expect(result.fileStructure.largestFiles).toHaveLength(1);
      expect(result.fileStructure.largestFiles[0]).toEqual({
        path: 'src/app.ts',
        lines: 50,
        size: 2048,
      });
    });
  });

  describe('largest files tracking', () => {
    it('should track top 10 largest files by lines', async () => {
      const files = Array.from({ length: 15 }, (_, i) => `/project/file${i}.ts`);

      // Mock different line counts
      files.forEach((_, i) => {
        mockWalker.countLines.mockResolvedValueOnce((i + 1) * 10); // 10, 20, 30, ..., 150
      });
      mockWalker.getFileSize.mockResolvedValue(1024);

      const result = await builder.build(files, '/project', {
        frameworks: [],
        language: 'typescript',
      }, { runtime: {}, dev: {} }, []);

      expect(result.fileStructure.largestFiles).toHaveLength(10);
      // Should be sorted in descending order
      expect(result.fileStructure.largestFiles[0].lines).toBe(150);
      expect(result.fileStructure.largestFiles[9].lines).toBe(60);
    });
  });
});
