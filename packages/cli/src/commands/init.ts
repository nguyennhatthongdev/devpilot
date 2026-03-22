import ora from 'ora';
import chalk from 'chalk';
import { InitProjectAction } from '../actions/init-project.js';

export async function initCommand() {
  const spinner = ora('Initializing DevPilot...').start();

  try {
    const action = new InitProjectAction();
    const result = await action.execute(process.cwd());

    if (!result.success) {
      spinner.fail(chalk.red('Initialization failed'));
      console.error(result.error);
      process.exit(1);
    }

    if (result.data!.alreadyInitialized) {
      spinner.warn(chalk.yellow('DevPilot already initialized in this project.'));
      return;
    }

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
