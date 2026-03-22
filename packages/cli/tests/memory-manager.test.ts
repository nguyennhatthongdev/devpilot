import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { MemoryManager } from '../src/lib/memory/memory-manager.js';

describe('MemoryManager', () => {
  let tempDir: string;
  let manager: MemoryManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'devpilot-memory-'));
    // MemoryManager uses projectRoot/.devpilot/shared/memory/
    manager = new MemoryManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('adds and retrieves decisions', async () => {
    await manager.addDecision({
      title: 'Use TypeScript',
      decision: 'Chose TypeScript over JavaScript',
      rationale: 'Better type safety',
      date: '2026-03-22',
      tags: ['language', 'tooling'],
    });

    const decisions = await manager.getDecisions();
    expect(decisions.length).toBe(1);
    expect(decisions[0].title).toBe('Use TypeScript');
    expect(decisions[0].id).toBe('dec-001');
  });

  it('adds and retrieves patterns', async () => {
    await manager.addPattern({
      pattern: 'Use kebab-case for file names',
      context: 'File naming convention',
      tags: ['naming'],
      examples: [{ good: 'my-component.ts', bad: 'MyComponent.ts' }],
    });

    const patterns = await manager.getPatterns();
    expect(patterns.length).toBe(1);
    expect(patterns[0].pattern).toBe('Use kebab-case for file names');
  });

  it('filters decisions by tag', async () => {
    await manager.addDecision({
      title: 'Use React',
      decision: 'Chose React',
      rationale: 'Ecosystem',
      date: '2026-03-22',
      tags: ['frontend'],
    });
    await manager.addDecision({
      title: 'Use Fastify',
      decision: 'Chose Fastify',
      rationale: 'Performance',
      date: '2026-03-22',
      tags: ['backend'],
    });

    const frontend = await manager.getDecisions({ tags: ['frontend'] });
    expect(frontend.length).toBe(1);
    expect(frontend[0].title).toBe('Use React');
  });

  it('prunes zero-usage items', async () => {
    await manager.addDecision({
      title: 'Unused decision',
      decision: 'test',
      rationale: 'test',
      date: '2026-03-22',
      tags: ['test'],
    });

    const pruned = await manager.pruneMemories('usage');
    expect(pruned).toBe(1);

    const remaining = await manager.getDecisions();
    expect(remaining.length).toBe(0);
  });

  it('builds memory context sorted by usage', async () => {
    await manager.addDecision({
      title: 'First',
      decision: 'A',
      rationale: 'test',
      date: '2026-03-22',
      tags: ['test'],
    });

    const context = await manager.buildMemoryContext();
    expect(context).toContain('# Project Memory');
    expect(context).toContain('First');
  });
});
