import { access, mkdir } from 'fs/promises';
import { join } from 'path';

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getDevpilotPaths(projectRoot: string) {
  const base = join(projectRoot, '.devpilot');
  return {
    base,
    shared: join(base, 'shared'),
    local: join(base, 'local'),
    sharedMemory: join(base, 'shared', 'memory'),
    localReviews: join(base, 'local', 'reviews'),
    localHealth: join(base, 'local', 'health.yaml'),
    localCache: join(base, 'local', 'cache'),
    sharedConfig: join(base, 'shared', 'config.yaml'),
    sharedDecisions: join(base, 'shared', 'memory', 'decisions.md'),
    sharedPatterns: join(base, 'shared', 'memory', 'patterns.md'),
    context: join(base, 'local', 'context.yaml'),
  };
}
