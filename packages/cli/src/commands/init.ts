import { writeFile } from 'fs/promises';
import ora from 'ora';
import chalk from 'chalk';
import YAML from 'yaml';
import { ensureDir, getDevpilotPaths, fileExists } from '../lib/file-utils.js';

export async function initCommand() {
  const spinner = ora('Initializing DevPilot...').start();

  try {
    const paths = getDevpilotPaths(process.cwd());

    // Check if already initialized
    if (await fileExists(paths.sharedConfig)) {
      spinner.warn(chalk.yellow('DevPilot already initialized in this project.'));
      return;
    }

    // Create shared directories (git-tracked)
    await ensureDir(paths.shared);
    await ensureDir(paths.sharedMemory);

    // Create local directories (git-ignored)
    await ensureDir(paths.local);
    await ensureDir(paths.localReviews);
    await ensureDir(paths.localCache);

    // Write shared config
    const defaultProjectConfig = {
      excludePatterns: ['node_modules', '.git', 'dist'],
      scanDepth: 10,
    };
    await writeFile(paths.sharedConfig, YAML.stringify(defaultProjectConfig));

    // Write empty memory files
    await writeFile(paths.sharedDecisions, YAML.stringify([]));
    await writeFile(paths.sharedPatterns, YAML.stringify([]));

    spinner.succeed(chalk.green('DevPilot initialized successfully!'));
    console.log(chalk.blue('\nCreated:'));
    console.log(`  ${chalk.dim('.devpilot/shared/')}  — git-tracked (decisions, patterns, config)`);
    console.log(`  ${chalk.dim('.devpilot/local/')}   — git-ignored (reviews, health, cache)`);
    console.log(chalk.blue('\nNext steps:'));
    console.log('  1. Run: devpilot config set-key anthropic');
    console.log('  2. Run: devpilot scan');
  } catch (error) {
    spinner.fail(chalk.red('Initialization failed'));
    console.error(error);
    process.exit(1);
  }
}
