import Fastify, { type FastifyInstance } from 'fastify';
import { findAndBindPort } from '../lib/server/port-finder.js';
import { registerApiRoutes } from '../lib/server/api-routes.js';
import { getDashboardHtml } from '../lib/server/dashboard-html.js';
import { ActionResult } from './types.js';

export interface DashboardResult {
  app: FastifyInstance;
  port: number;
}

export class StartDashboardAction {
  async execute(projectRoot: string): Promise<ActionResult<DashboardResult>> {
    try {
      const app = Fastify();

      // Serve dashboard HTML at root
      const dashboardHtml = getDashboardHtml();
      app.get('/', async (_req, reply) => {
        reply.type('text/html').send(dashboardHtml);
      });

      // Register API routes
      registerApiRoutes(app, projectRoot);

      // Bind directly to eliminate TOCTOU race condition
      const port = await findAndBindPort(app);

      return {
        success: true,
        data: { app, port },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start dashboard',
      };
    }
  }
}
