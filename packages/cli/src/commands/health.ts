import { join } from 'path';
import { writeFile, readFile } from 'fs/promises';
import ora from 'ora';
import chalk from 'chalk';
import YAML from 'yaml';
import { ComplexityAnalyzer } from '../lib/health/complexity-analyzer.js';
import { DuplicationDetector } from '../lib/health/duplication-detector.js';
import { DependencyChecker } from '../lib/health/dependency-checker.js';
import { ScoreCalculator } from '../lib/health/score-calculator.js';
import { HealthReporter } from '../lib/health/health-reporter.js';
import { HealthScore } from '../lib/health/types.js';
import { getDevpilotPaths, ensureDir } from '../lib/file-utils.js';
import { FileWalker } from '../lib/scanner/file-walker.js';
import { IgnoreFilter } from '../lib/scanner/ignore-filter.js';

export async function healthCommand() {
  const spinner = ora('Analyzing project health...').start();

  try {
    const rootPath = process.cwd();
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
      spinner.text = 'No context found, scanning...';
      const walker = new FileWalker();
      const ignoreFilter = new IgnoreFilter();
      await ignoreFilter.loadIgnoreFile(rootPath, '.gitignore');
      ignoreFilter.addPatterns(['node_modules', '.git', 'dist', 'build']);
      const allFiles = await walker.walk(rootPath, 10);
      codeFiles = ignoreFilter.filter(allFiles, rootPath);
    }

    // Run analyzers
    spinner.text = 'Analyzing complexity...';
    const complexity = await new ComplexityAnalyzer().analyze(codeFiles);

    spinner.text = 'Detecting duplication...';
    const duplication = await new DuplicationDetector().detect(codeFiles);

    spinner.text = 'Checking dependencies...';
    const dependencies = await new DependencyChecker().check(rootPath);

    spinner.text = 'Analyzing file sizes...';
    const scoreCalculator = new ScoreCalculator();
    const fileSize = scoreCalculator.calculateFileSizeScore(contextLargestFiles);

    // Calculate overall
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

    spinner.succeed(chalk.green('Analysis complete!'));

    // Display report
    new HealthReporter().display(healthScore);

    console.log(chalk.dim(`\nHealth data saved to ${paths.localHealth}`));
  } catch (error: unknown) {
    spinner.fail(chalk.red('Health analysis failed'));
    console.error((error as Error).message);
    process.exit(1);
  }
}
