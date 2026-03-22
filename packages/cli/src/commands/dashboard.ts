import Fastify from 'fastify';
import chalk from 'chalk';
import ora from 'ora';
import { findAvailablePort } from '../lib/server/port-finder.js';
import { registerApiRoutes } from '../lib/server/api-routes.js';
import { getDashboardHtml } from '../lib/server/dashboard-html.js';

export async function dashboardCommand() {
  const spinner = ora('Starting dashboard...').start();

  try {
    const projectRoot = process.cwd();
    const port = await findAvailablePort(3141);

    const app = Fastify();

    // Serve dashboard HTML at root
    const dashboardHtml = getDashboardHtml();
    app.get('/', async (_req, reply) => {
      reply.type('text/html').send(dashboardHtml);
    });

    // Register API routes
    registerApiRoutes(app, projectRoot);

    // Start server
    await app.listen({ port, host: '127.0.0.1' });

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

    // Keep alive until Ctrl+C
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\nStopping dashboard...'));
      await app.close();
      process.exit(0);
    });
  } catch (error: unknown) {
    spinner.fail(chalk.red('Failed to start dashboard'));
    console.error((error as Error).message);
    process.exit(1);
  }
}
