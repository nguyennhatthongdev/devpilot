import { join } from 'path';
import { writeFile, readFile } from 'fs/promises';
import YAML from 'yaml';
import { ComplexityAnalyzer } from '../lib/health/complexity-analyzer.js';
import { DuplicationDetector } from '../lib/health/duplication-detector.js';
import { DependencyChecker } from '../lib/health/dependency-checker.js';
import { TestCoverageDetector } from '../lib/health/test-coverage-detector.js';
import { SecurityAuditor } from '../lib/health/security-auditor.js';
import { ScoreCalculator } from '../lib/health/score-calculator.js';
import { HealthHistoryManager } from '../lib/health/history-manager.js';
import { StyleConsistencyAnalyzer } from '../lib/health/style-consistency-analyzer.js';
import { DeadCodeDetector } from '../lib/health/dead-code-detector.js';
import { TodoTracker } from '../lib/health/todo-tracker.js';
import { DocCoverageAnalyzer } from '../lib/health/doc-coverage-analyzer.js';
import { ImportCycleDetector } from '../lib/health/import-cycle-detector.js';
import { HealthScore } from '../lib/health/types.js';
import { getDevpilotPaths, ensureDir } from '../lib/file-utils.js';
import { FileWalker } from '../lib/scanner/file-walker.js';
import { IgnoreFilter } from '../lib/scanner/ignore-filter.js';
import { ActionResult } from './types.js';

export class RunHealthCheckAction {
  async execute(rootPath: string): Promise<ActionResult<HealthScore>> {
    try {
      const paths = getDevpilotPaths(rootPath);

      // Always do a full file scan for accurate health analysis
      const walker = new FileWalker();
      const ignoreFilter = new IgnoreFilter();
      await ignoreFilter.loadIgnoreFile(rootPath, '.gitignore');
      await ignoreFilter.loadIgnoreFile(rootPath, '.devpilotignore');
      ignoreFilter.addPatterns(['node_modules', '.git', 'dist', 'build']);
      const allFiles = await walker.walk(rootPath, 10);
      const codeFiles = ignoreFilter.filter(allFiles, rootPath);

      // Get largest files from context for file size scoring
      let contextLargestFiles: Array<{ path: string; lines: number }> = [];
      try {
        const contextContent = await readFile(paths.context, 'utf-8');
        const context = YAML.parse(contextContent);
        contextLargestFiles = context.fileStructure?.largestFiles ?? [];
      } catch {
        // No context available
      }

      // Run all analyzers in parallel
      const [
        complexity, duplication, dependencies, testCoverage, security,
        styleConsistency, deadCode, todos, docCoverage, importCycles,
      ] = await Promise.all([
        new ComplexityAnalyzer().analyze(codeFiles),
        new DuplicationDetector().detect(codeFiles),
        new DependencyChecker().check(rootPath),
        new TestCoverageDetector(rootPath).detect(),
        new SecurityAuditor(rootPath).audit(),
        new StyleConsistencyAnalyzer().analyze(codeFiles, rootPath),
        new DeadCodeDetector().analyze(codeFiles, rootPath),
        new TodoTracker().analyze(codeFiles, rootPath),
        new DocCoverageAnalyzer().analyze(codeFiles, rootPath),
        new ImportCycleDetector().analyze(codeFiles, rootPath),
      ]);

      // Calculate scores
      const scoreCalculator = new ScoreCalculator();
      const fileSize = scoreCalculator.calculateFileSizeScore(contextLargestFiles);

      const breakdown = {
        complexity, duplication, dependencies, fileSize,
        styleConsistency, deadCode, todos, docCoverage, importCycles,
      };
      const overallScore = scoreCalculator.calculateOverallScore(
        breakdown, testCoverage, security,
      );

      // Use history-based trend instead of single previous scan
      const historyManager = new HealthHistoryManager();
      const history = await historyManager.loadHistory(rootPath);
      const trend = history.length >= 2
        ? historyManager.getTrend(history)
        : await scoreCalculator.calculateTrend(overallScore, rootPath);

      const healthScore: HealthScore = {
        scannedAt: new Date().toISOString(),
        overallScore,
        breakdown,
        testCoverage,
        security,
        trend,
      };

      // Save results and history
      await ensureDir(paths.local);
      await writeFile(paths.localHealth, YAML.stringify(healthScore));
      await historyManager.saveHistory(healthScore, rootPath);

      return { success: true, data: healthScore };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health analysis failed',
      };
    }
  }
}
