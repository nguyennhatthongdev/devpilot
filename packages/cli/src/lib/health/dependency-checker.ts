import { readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DependencyMetrics } from './types.js';

const execAsync = promisify(exec);

export class DependencyChecker {
  async check(rootPath: string): Promise<DependencyMetrics> {
    try {
      const pkg = JSON.parse(await readFile(join(rootPath, 'package.json'), 'utf-8'));
      const total = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length;

      // Check outdated packages (with timeout)
      let outdatedData: Record<string, { current: string; latest: string }> = {};
      try {
        const { stdout } = await execAsync('npm outdated --json 2>/dev/null || echo "{}"', {
          cwd: rootPath,
          timeout: 30000,
        });
        outdatedData = JSON.parse(stdout || '{}');
      } catch {
        // npm outdated exits with code 1 when packages are outdated
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
