import { readFile } from 'fs/promises';
import { join } from 'path';
import { TechStack } from './types.js';

interface DetectionRule {
  pattern: string | RegExp;
  framework: string;
}

const FRAMEWORK_RULES: DetectionRule[] = [
  { pattern: 'next.config', framework: 'next.js' },
  { pattern: 'nuxt.config', framework: 'nuxt.js' },
  { pattern: 'vite.config', framework: 'vite' },
  { pattern: 'angular.json', framework: 'angular' },
  { pattern: 'svelte.config', framework: 'svelte' },
  { pattern: 'remix.config', framework: 'remix' },
  { pattern: 'astro.config', framework: 'astro' },
];

const PKG_MANAGER_FILES: Record<string, string> = {
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lockb': 'bun',
  'package-lock.json': 'npm',
};

export class TechDetector {
  async detect(rootPath: string, files: string[]): Promise<TechStack> {
    const frameworks: string[] = [];
    let language = 'javascript';
    let packageManager: string | undefined;
    let nodeVersion: string | undefined;

    // Detect frameworks from config files
    for (const rule of FRAMEWORK_RULES) {
      if (files.some(f => f.includes(rule.pattern as string))) {
        frameworks.push(rule.framework);
      }
    }

    // Detect TypeScript
    if (files.some(f => f.endsWith('tsconfig.json'))) {
      language = 'typescript';
    }

    // Detect package manager from lock files
    for (const [lockFile, manager] of Object.entries(PKG_MANAGER_FILES)) {
      if (files.some(f => f.endsWith(lockFile))) {
        packageManager = manager;
        break;
      }
    }

    // Extract data from package.json
    try {
      const pkg = JSON.parse(await readFile(join(rootPath, 'package.json'), 'utf-8'));
      if (pkg.engines?.node) nodeVersion = pkg.engines.node;
      if (pkg.dependencies?.react || pkg.devDependencies?.react) frameworks.push('react');
      if (pkg.dependencies?.vue || pkg.devDependencies?.vue) frameworks.push('vue');
      if (pkg.dependencies?.express || pkg.devDependencies?.express) frameworks.push('express');
      if (pkg.dependencies?.fastify || pkg.devDependencies?.fastify) frameworks.push('fastify');
    } catch {
      // No package.json
    }

    return { frameworks: [...new Set(frameworks)], language, packageManager, nodeVersion };
  }

  async extractDependencies(rootPath: string): Promise<{
    runtime: Record<string, string>;
    dev: Record<string, string>;
  }> {
    try {
      const pkg = JSON.parse(await readFile(join(rootPath, 'package.json'), 'utf-8'));
      return {
        runtime: pkg.dependencies || {},
        dev: pkg.devDependencies || {},
      };
    } catch {
      return { runtime: {}, dev: {} };
    }
  }
}
