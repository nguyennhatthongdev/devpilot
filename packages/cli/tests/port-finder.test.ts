import { describe, it, expect, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { createServer, type Server } from 'net';
import { findAndBindPort } from '../src/lib/server/port-finder.js';

describe('findAndBindPort', () => {
  const apps: FastifyInstance[] = [];
  const servers: Server[] = [];

  afterEach(async () => {
    for (const app of apps) {
      try { await app.close(); } catch { /* ignore */ }
    }
    for (const server of servers) {
      server.close();
    }
    apps.length = 0;
    servers.length = 0;
  });

  it('binds to the starting port when available', async () => {
    const app = Fastify();
    apps.push(app);
    const port = await findAndBindPort(app, 19100);
    expect(port).toBe(19100);
  });

  it('skips occupied port and binds to next', async () => {
    // Occupy port 19200
    const blocker = createServer();
    servers.push(blocker);
    await new Promise<void>((resolve) => {
      blocker.listen(19200, '127.0.0.1', () => resolve());
    });

    const app = Fastify();
    apps.push(app);
    const port = await findAndBindPort(app, 19200);
    expect(port).toBe(19201);
  });

  it('throws when all ports exhausted', async () => {
    // Occupy 10 consecutive ports
    for (let p = 19300; p < 19310; p++) {
      const server = createServer();
      servers.push(server);
      await new Promise<void>((resolve) => {
        server.listen(p, '127.0.0.1', () => resolve());
      });
    }

    const app = Fastify();
    apps.push(app);
    await expect(findAndBindPort(app, 19300)).rejects.toThrow('No available ports');
  });
});
