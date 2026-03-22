import ora from 'ora';
import chalk from 'chalk';
import { RunHealthCheckAction } from '../actions/run-health-check.js';
import { HealthReporter } from '../lib/health/health-reporter.js';
import { getDevpilotPaths } from '../lib/file-utils.js';

export async function healthCommand() {
  const spinner = ora('Analyzing project health...').start();

  try {
    const rootPath = process.cwd();
    const action = new RunHealthCheckAction();

    const result = await action.execute(rootPath);

    if (!result.success) {
      spinner.fail(chalk.red('Health analysis failed'));
      console.error(result.error);
      process.exit(1);
    }

    const healthScore = result.data!;

    spinner.succeed(chalk.green('Analysis complete!'));

    // Display report
    new HealthReporter().display(healthScore);

    const paths = getDevpilotPaths(rootPath);
    console.log(chalk.dim(`\nHealth data saved to ${paths.localHealth}`));
  } catch (error: unknown) {
    spinner.fail(chalk.red('Health analysis failed'));
    console.error((error as Error).message);
    process.exit(1);
  }
}
