import type { FastifyInstance } from 'fastify';

export async function findAndBindPort(
  app: FastifyInstance,
  startPort: number = 3141,
): Promise<number> {
  for (let port = startPort; port < startPort + 10; port++) {
    try {
      await app.listen({ port, host: '127.0.0.1' });
      return port;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') continue;
      throw err;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${startPort + 10}`);
}
