import { access, readFile } from 'fs/promises';
import { join } from 'path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

/** Detect package manager from lock files, then package.json field, fallback npm */
export async function detectPackageManager(rootPath: string): Promise<PackageManager> {
  const exists = async (f: string) => {
    try { await access(join(rootPath, f)); return true; }
    catch { return false; }
  };

  // Priority: lock files first
  if (await exists('bun.lock') || await exists('bun.lockb')) return 'bun';
  if (await exists('pnpm-lock.yaml')) return 'pnpm';
  if (await exists('yarn.lock')) return 'yarn';
  if (await exists('package-lock.json')) return 'npm';

  // Fallback: package.json packageManager field
  try {
    const pkg = JSON.parse(await readFile(join(rootPath, 'package.json'), 'utf-8'));
    if (pkg.packageManager) {
      const match = pkg.packageManager.match(/^(npm|yarn|pnpm|bun)@/);
      if (match) return match[1] as PackageManager;
    }
  } catch {
    // No package.json
  }

  return 'npm';
}
