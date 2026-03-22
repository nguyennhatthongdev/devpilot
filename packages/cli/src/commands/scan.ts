import ora from 'ora';
import chalk from 'chalk';
import { ScanProjectAction } from '../actions/scan-project.js';

export async function scanCommand(options: {
  depth?: string;
  exclude?: string;
  full?: boolean;
}) {
  const spinner = ora('Scanning codebase...').start();

  try {
    const rootPath = process.cwd();
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
    console.log(`  Lines of Code: ${contextData.stats.totalLines.toLocaleString()}`);
    console.log(`  Language: ${contextData.techStack.language}`);
    if (contextData.techStack.frameworks.length > 0) {
      console.log(`  Frameworks: ${contextData.techStack.frameworks.join(', ')}`);
    }
    if (contextData.techStack.packageManager) {
      console.log(`  Package Manager: ${contextData.techStack.packageManager}`);
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
