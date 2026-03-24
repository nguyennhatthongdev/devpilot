import { readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DependencyMetrics } from './types.js';
import { detectPackageManager } from './package-manager-detector.js';

const execAsync = promisify(exec);

export class DependencyChecker {
  async check(rootPath: string): Promise<DependencyMetrics> {
    try {
      const pkg = JSON.parse(await readFile(join(rootPath, 'package.json'), 'utf-8'));
      const total = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length;

      // Detect package manager and check outdated packages
      const manager = await detectPackageManager(rootPath);
      let outdatedData: Record<string, { current: string; latest: string }> = {};
      try {
        const { stdout } = await execAsync(`${manager} outdated --json`, {
          cwd: rootPath, timeout: 30000,
        });
        outdatedData = JSON.parse(stdout || '{}');
      } catch (error: any) {
        // npm outdated exits with code 1 when outdated deps found — stdout has data
        if (error.stdout) {
          try {
            outdatedData = JSON.parse(error.stdout);
          } catch {
            // Parse failed, leave empty
          }
        }
      }

      const outdated = Object.keys(outdatedData).length;
      const outdatedList = Object.entries(outdatedData)
        .slice(0, 5)
        .map(([name, data]) => ({
          name,
          current: data.current ?? 'unknown',
          latest: data.latest ?? 'unknown',
        }));

      const outdatedPct = total > 0 ? (outdated / total) * 100 : 0;
      let score = 100;
      if (outdatedPct > 50) score = 20;
      else if (outdatedPct > 30) score = 40;
      else if (outdatedPct > 20) score = 60;
      else if (outdatedPct > 10) score = 80;

      return { score, total, outdated, outdatedList };
    } catch {
      return { score: 70, total: 0, outdated: 0, outdatedList: [] };
    }
  }
}
