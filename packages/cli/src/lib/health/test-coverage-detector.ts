import { readFile } from 'fs/promises';
import { join } from 'path';
import { TestCoverageMetrics } from './types.js';

export class TestCoverageDetector {
  constructor(private projectRoot: string) {}

  async detect(): Promise<TestCoverageMetrics | undefined> {
    const runner = await this.detectTestRunner();

    // Try coverage-summary.json (vitest/jest)
    try {
      const summaryPath = join(this.projectRoot, 'coverage/coverage-summary.json');
      const summary = await this.parseCoverageSummary(summaryPath);
      if (summary) return { ...summary, runner };
    } catch {
      // Fall through to lcov
    }

    // Try lcov.info (nyc/c8)
    try {
      const lcovPath = join(this.projectRoot, 'coverage/lcov.info');
      const lcov = await this.parseLcov(lcovPath);
      if (lcov) return { ...lcov, runner };
    } catch {
      // No coverage found
    }

    return undefined;
  }

  private async detectTestRunner(): Promise<string | undefined> {
    try {
      const pkg = JSON.parse(await readFile(join(this.projectRoot, 'package.json'), 'utf-8'));
      const scripts = pkg.scripts || {};
      const devDeps = { ...pkg.devDependencies, ...pkg.dependencies };

      if (devDeps.vitest || scripts.test?.includes('vitest')) return 'vitest';
      if (devDeps.jest || scripts.test?.includes('jest')) return 'jest';
      if (devDeps.nyc || scripts.test?.includes('nyc')) return 'nyc';
      if (devDeps.c8 || scripts.test?.includes('c8')) return 'c8';
      return undefined;
    } catch {
      return undefined;
    }
  }

  private async parseCoverageSummary(filePath: string): Promise<Omit<TestCoverageMetrics, 'runner'> | undefined> {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const total = data.total;
    if (!total) return undefined;

    return {
      lines: total.lines?.pct || 0,
      statements: total.statements?.pct || 0,
      branches: total.branches?.pct || 0,
      functions: total.functions?.pct || 0,
    };
  }

  private async parseLcov(filePath: string): Promise<Omit<TestCoverageMetrics, 'runner'> | undefined> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    let linesFound = 0, linesHit = 0;
    let branchesFound = 0, branchesHit = 0;
    let functionsFound = 0, functionsHit = 0;

    for (const line of lines) {
      if (line.startsWith('LF:')) linesFound += parseInt(line.split(':')[1], 10);
      if (line.startsWith('LH:')) linesHit += parseInt(line.split(':')[1], 10);
      if (line.startsWith('BRF:')) branchesFound += parseInt(line.split(':')[1], 10);
      if (line.startsWith('BRH:')) branchesHit += parseInt(line.split(':')[1], 10);
      if (line.startsWith('FNF:')) functionsFound += parseInt(line.split(':')[1], 10);
      if (line.startsWith('FNH:')) functionsHit += parseInt(line.split(':')[1], 10);
    }

    if (linesFound === 0) return undefined;

    // When branchesFound=0, mark as unavailable so consumers exclude from avg
    const branchesUnavailable = branchesFound === 0;

    return {
      lines: (linesHit / linesFound) * 100,
      statements: (linesHit / linesFound) * 100,
      branches: branchesFound > 0 ? (branchesHit / branchesFound) * 100 : 0,
      functions: functionsFound > 0 ? (functionsHit / functionsFound) * 100 : 0,
      branchesUnavailable,
    };
  }
}
