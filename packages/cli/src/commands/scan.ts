import ora from 'ora';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import { ScanProjectAction } from '../actions/scan-project.js';
import { getDevpilotPaths } from '../lib/file-utils.js';

export async function scanCommand(options: {
  depth?: string;
  exclude?: string;
  full?: boolean;
}) {
  const rootPath = process.cwd();

  // Check cache if not --full
  if (!options.full) {
    try {
      const paths = getDevpilotPaths(rootPath);
      const fileStat = await stat(paths.context);
      const ageMinutes = (Date.now() - fileStat.mtimeMs) / 60000;
      if (ageMinutes < 15) {
        console.log(chalk.dim('Using cached context (< 15min old). Use --full to rescan.'));
        return;
      }
    } catch {
      // No cache, proceed with scan
    }
  }

  const spinner = ora('Scanning codebase...').start();

  try {
    const action = new ScanProjectAction();

    const result = await action.execute(rootPath, {
      depth: options.depth ? parseInt(options.depth, 10) : undefined,
      excludePatterns: options.exclude ? options.exclude.split(',') : undefined,
    });

    if (!result.success) {
      spinner.fail(chalk.red('Scan failed'));
      console.error(result.error);
      process.exit(1);
    }

    const { contextData, detectedPatternsCount } = result.data!;

    spinner.succeed(chalk.green('Scan complete!'));

    // Display summary
    console.log(chalk.blue('\nProject Summary:'));
    console.log(`  Files: ${contextData.stats.totalFiles}`);
    console.log(`  Total Lines: ${contextData.stats.totalLines.toLocaleString()}`);
    console.log(`  Code Lines: ${contextData.stats.codeLines.toLocaleString()}`);
    console.log(`  Language: ${contextData.techStack.language}`);
    if (contextData.techStack.frameworks.length > 0) {
      console.log(`  Frameworks: ${contextData.techStack.frameworks.join(', ')}`);
    }
    if (contextData.techStack.packageManager) {
      console.log(`  Package Manager: ${contextData.techStack.packageManager}`);
    }

    // Git stats
    if (contextData.git) {
      console.log(chalk.blue('\nGit Repository:'));
      console.log(`  Commits: ${contextData.git.commits.toLocaleString()}`);
      console.log(`  Contributors: ${contextData.git.contributors}`);
      console.log(`  Branches: ${contextData.git.branches}`);
      console.log(`  Current Branch: ${contextData.git.currentBranch}`);
      console.log(`  First Commit: ${contextData.git.firstCommit}`);
      console.log(`  Last Commit: ${contextData.git.lastCommit}`);
      console.log(`  Commits/Week: ${contextData.git.commitsPerWeek}`);
    }

    console.log(`\n${chalk.green('✓')} Context saved to ${chalk.dim('.devpilot/local/context.yaml')}`);

    if (detectedPatternsCount > 0) {
      console.log(chalk.green(`✓ Auto-detected ${detectedPatternsCount} pattern(s)`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Scan failed'));
    console.error(error);
    process.exit(1);
  }
}
