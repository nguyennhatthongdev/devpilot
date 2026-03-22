import { join } from 'path';
import { writeFile, readFile } from 'fs/promises';
import YAML from 'yaml';
import { ComplexityAnalyzer } from '../lib/health/complexity-analyzer.js';
import { DuplicationDetector } from '../lib/health/duplication-detector.js';
import { DependencyChecker } from '../lib/health/dependency-checker.js';
import { ScoreCalculator } from '../lib/health/score-calculator.js';
import { HealthScore } from '../lib/health/types.js';
import { getDevpilotPaths, ensureDir } from '../lib/file-utils.js';
import { FileWalker } from '../lib/scanner/file-walker.js';
import { IgnoreFilter } from '../lib/scanner/ignore-filter.js';
import { ActionResult } from './types.js';

export class RunHealthCheckAction {
  async execute(rootPath: string): Promise<ActionResult<HealthScore>> {
    try {
      const paths = getDevpilotPaths(rootPath);

      // Get file list — prefer context.yaml, fallback to fresh scan
      let codeFiles: string[];
      let contextLargestFiles: Array<{ path: string; lines: number }> = [];

      try {
        const contextContent = await readFile(paths.context, 'utf-8');
        const context = YAML.parse(contextContent);
        contextLargestFiles = context.fileStructure?.largestFiles ?? [];
        codeFiles = contextLargestFiles.map((f: { path: string }) => join(rootPath, f.path));
      } catch {
        // No context, do a quick scan
        const walker = new FileWalker();
        const ignoreFilter = new IgnoreFilter();
        await ignoreFilter.loadIgnoreFile(rootPath, '.gitignore');
        ignoreFilter.addPatterns(['node_modules', '.git', 'dist', 'build']);
        const allFiles = await walker.walk(rootPath, 10);
        codeFiles = ignoreFilter.filter(allFiles, rootPath);
      }

      // Run analyzers
      const complexity = await new ComplexityAnalyzer().analyze(codeFiles);
      const duplication = await new DuplicationDetector().detect(codeFiles);
      const dependencies = await new DependencyChecker().check(rootPath);

      // Calculate scores
      const scoreCalculator = new ScoreCalculator();
      const fileSize = scoreCalculator.calculateFileSizeScore(contextLargestFiles);

      const breakdown = { complexity, duplication, dependencies, fileSize };
      const overallScore = scoreCalculator.calculateOverallScore(breakdown);
      const trend = await scoreCalculator.calculateTrend(overallScore, rootPath);

      const healthScore: HealthScore = {
        scannedAt: new Date().toISOString(),
        overallScore,
        breakdown,
        trend,
      };

      // Save results
      await ensureDir(paths.local);
      await writeFile(paths.localHealth, YAML.stringify(healthScore));

      return {
        success: true,
        data: healthScore,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health analysis failed',
      };
    }
  }
}
