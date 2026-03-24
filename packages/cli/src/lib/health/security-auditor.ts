import { readFile, writeFile, stat, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { SecurityMetrics } from './types.js';
import { detectPackageManager } from './package-manager-detector.js';

const execAsync = promisify(exec);

export class SecurityAuditor {
  private cachePath: string;

  constructor(private projectRoot: string) {
    this.cachePath = join(projectRoot, '.devpilot/local/cache/npm-audit.json');
  }

  async audit(): Promise<SecurityMetrics | undefined> {
    // Check cache (24h TTL)
    const cached = await this.loadCache();
    if (cached) return cached;

    // Run npm audit
    const auditData = await this.runAudit();
    if (!auditData) return undefined;

    const metrics = this.parseAuditData(auditData);
    await this.saveCache(metrics);
    return metrics;
  }

  private async loadCache(): Promise<SecurityMetrics | undefined> {
    try {
      const fileStat = await stat(this.cachePath);
      const ageHours = (Date.now() - fileStat.mtimeMs) / (1000 * 60 * 60);
      if (ageHours < 24) {
        return JSON.parse(await readFile(this.cachePath, 'utf-8'));
      }
    } catch {
      // No cache or invalid
    }
    return undefined;
  }

  private async saveCache(metrics: SecurityMetrics): Promise<void> {
    try {
      await mkdir(dirname(this.cachePath), { recursive: true });
      await writeFile(this.cachePath, JSON.stringify(metrics, null, 2), 'utf-8');
    } catch {
      // Cache save failure is non-critical
    }
  }

  private async runAudit(): Promise<any> {
    try {
      const manager = await detectPackageManager(this.projectRoot);
      const cmd = manager === 'yarn'
        ? 'yarn audit --json'
        : `${manager} audit --json`;

      const { stdout } = await execAsync(cmd, {
        cwd: this.projectRoot, timeout: 30000,
      });
      return JSON.parse(stdout);
    } catch (error: any) {
      // audit commands exit code 1 when vulnerabilities found
      if (error.stdout) {
        try { return JSON.parse(error.stdout); } catch { /* parse failed */ }
      }
      if (error.killed) console.warn('Security audit timed out (>30s)');
      return undefined;
    }
  }

  private parseAuditData(data: any): SecurityMetrics {
    const vulns = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
    const packages: SecurityMetrics['packages'] = [];
    const vulnerabilities = data.vulnerabilities || {};

    for (const [pkgName, vuln] of Object.entries<any>(vulnerabilities)) {
      const severity = vuln.severity as keyof typeof vulns;
      if (Object.prototype.hasOwnProperty.call(vulns, severity)) {
        vulns[severity]++;
        packages.push({
          name: pkgName,
          severity,
          via: Array.isArray(vuln.via) ? vuln.via[0]?.title || 'Unknown' : 'Unknown',
        });
      }
    }

    const total = vulns.critical + vulns.high + vulns.moderate + vulns.low + vulns.info;
    return { vulnerabilities: vulns, total, packages };
  }
}
