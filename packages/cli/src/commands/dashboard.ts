import chalk from 'chalk';
import ora from 'ora';
import { StartDashboardAction } from '../actions/start-dashboard.js';

export async function dashboardCommand() {
  const spinner = ora('Starting dashboard...').start();

  try {
    const projectRoot = process.cwd();
    const action = new StartDashboardAction();

    const result = await action.execute(projectRoot);

    if (!result.success) {
      spinner.fail(chalk.red('Failed to start dashboard'));
      console.error(result.error);
      process.exit(1);
    }

    const { app, port } = result.data!;

    spinner.succeed(chalk.green('Dashboard running!'));
    console.log(chalk.blue(`\n  DevPilot Dashboard`));
    console.log(chalk.dim(`  URL: http://localhost:${port}`));
    console.log(chalk.dim(`  Data: ${projectRoot}/.devpilot/`));
    console.log(chalk.dim(`\n  Press Ctrl+C to stop\n`));

    // Open browser
    try {
      const open = await import('open');
      await open.default(`http://localhost:${port}`);
    } catch {
      // open package may not be available
    }

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      console.log(chalk.yellow(`\nReceived ${signal}, stopping dashboard...`));
      try {
        await app.close();
        process.exit(0);
      } catch {
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));
  } catch (error: unknown) {
    spinner.fail(chalk.red('Failed to start dashboard'));
    console.error((error as Error).message);
    process.exit(1);
  }
}
