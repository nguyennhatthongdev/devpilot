import { writeFile } from 'fs/promises';
import YAML from 'yaml';
import { FileWalker } from '../lib/scanner/file-walker.js';
import { IgnoreFilter } from '../lib/scanner/ignore-filter.js';
import { TechDetector } from '../lib/scanner/tech-detector.js';
import { ContextBuilder } from '../lib/scanner/context-builder.js';
import { ConfigManager } from '../lib/config-manager.js';
import { ensureDir, getDevpilotPaths } from '../lib/file-utils.js';
import { PatternDetector } from '../lib/memory/pattern-detector.js';
import { MemoryManager } from '../lib/memory/memory-manager.js';
import { type ContextData } from '../lib/scanner/types.js';
import { ActionResult } from './types.js';

export interface ScanResult {
  contextData: ContextData;
  detectedPatternsCount: number;
}

export interface ScanOptions {
  depth?: number;
  excludePatterns?: string[];
}

export class ScanProjectAction {
  async execute(rootPath: string, options: ScanOptions = {}): Promise<ActionResult<ScanResult>> {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.mergeConfigs(rootPath);
      const paths = getDevpilotPaths(rootPath);

      // Initialize components
      const walker = new FileWalker();
      const ignoreFilter = new IgnoreFilter();
      const techDetector = new TechDetector();
      const contextBuilder = new ContextBuilder();

      // Load ignore patterns
      await ignoreFilter.loadIgnoreFile(rootPath, '.gitignore');
      await ignoreFilter.loadIgnoreFile(rootPath, '.devpilotignore');
      ignoreFilter.addPatterns(config.projectDefaults.excludePatterns);
      if (options.excludePatterns) {
        ignoreFilter.addPatterns(options.excludePatterns);
      }

      // Walk files
      const maxDepth = options.depth ?? config.projectDefaults.scanDepth;
      const allFiles = await walker.walk(rootPath, maxDepth);
      const files = ignoreFilter.filter(allFiles, rootPath);

      // Detect tech stack and dependencies
      const techStack = await techDetector.detect(rootPath, files);
      const dependencies = await techDetector.extractDependencies(rootPath);

      // Build context
      const contextData = await contextBuilder.build(
        files,
        rootPath,
        techStack,
        dependencies,
        config.projectDefaults.excludePatterns,
      );

      // Save to .devpilot/local/context.yaml
      await ensureDir(paths.local);
      await writeFile(paths.context, YAML.stringify(contextData));

      // Auto-detect patterns
      let detectedPatternsCount = 0;
      try {
        const patternDetector = new PatternDetector();
        const detectedPatterns = patternDetector.detectPatterns(contextData);
        if (detectedPatterns.length > 0) {
          const memoryManager = new MemoryManager(rootPath);
          for (const pattern of detectedPatterns) {
            await memoryManager.addPattern(pattern);
          }
          detectedPatternsCount = detectedPatterns.length;
        }
      } catch {
        // Memory not initialized yet, skip pattern detection
      }

      return {
        success: true,
        data: {
          contextData,
          detectedPatternsCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scan failed',
      };
    }
  }
}
