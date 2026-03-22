import { describe, it, expect } from 'vitest';
import {
  serializeDecisions,
  parseDecisions,
  serializePatterns,
  parsePatterns,
} from '../src/lib/memory/markdown-parser.js';
import type { Decision, Pattern } from '../src/lib/memory/types.js';

describe('markdown-parser decisions', () => {
  const sampleDecision: Decision = {
    id: 'dec-001',
    title: 'Use TypeScript',
    date: '2026-03-22',
    context: 'Need strong typing',
    decision: 'Chose TypeScript over JavaScript',
    rationale: 'Better type safety and tooling',
    tags: ['language', 'tooling'],
    usageCount: 5,
    lastUsed: '2026-03-22T10:00:00.000Z',
  };

  it('round-trips empty array', () => {
    const md = serializeDecisions([]);
    const result = parseDecisions(md);
    expect(result).toEqual([]);
  });

  it('round-trips single decision', () => {
    const md = serializeDecisions([sampleDecision]);
    const result = parseDecisions(md);
    expect(result).toEqual([sampleDecision]);
  });

  it('round-trips multiple decisions', () => {
    const second: Decision = {
      ...sampleDecision,
      id: 'dec-002',
      title: 'Use Fastify',
      tags: ['backend'],
    };
    const md = serializeDecisions([sampleDecision, second]);
    const result = parseDecisions(md);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Use TypeScript');
    expect(result[1].title).toBe('Use Fastify');
  });

  it('handles special characters in content', () => {
    const dec: Decision = {
      ...sampleDecision,
      context: 'Context with: colons and **bold** and `code`',
      decision: 'Decision: use this approach',
    };
    const md = serializeDecisions([dec]);
    const result = parseDecisions(md);
    expect(result[0].context).toBe(dec.context);
    expect(result[0].decision).toBe(dec.decision);
  });

  it('handles empty tags', () => {
    const dec: Decision = { ...sampleDecision, tags: [] };
    const md = serializeDecisions([dec]);
    const result = parseDecisions(md);
    expect(result[0].tags).toEqual([]);
  });
});

describe('markdown-parser patterns', () => {
  const samplePattern: Pattern = {
    id: 'pat-001',
    pattern: 'Use kebab-case for file names',
    scope: 'all',
    autoDetected: true,
    tags: ['naming', 'conventions'],
    usageCount: 3,
    lastUsed: '2026-03-22T10:00:00.000Z',
    examples: [{ good: 'my-component.ts', bad: 'MyComponent.ts' }],
  };

  it('round-trips empty array', () => {
    const md = serializePatterns([]);
    const result = parsePatterns(md);
    expect(result).toEqual([]);
  });

  it('round-trips single pattern', () => {
    const md = serializePatterns([samplePattern]);
    const result = parsePatterns(md);
    expect(result).toEqual([samplePattern]);
  });

  it('round-trips pattern without examples', () => {
    const pat: Pattern = { ...samplePattern, examples: [] };
    const md = serializePatterns([pat]);
    const result = parsePatterns(md);
    expect(result[0].examples).toEqual([]);
  });

  it('handles autoDetected false', () => {
    const pat: Pattern = { ...samplePattern, autoDetected: false };
    const md = serializePatterns([pat]);
    const result = parsePatterns(md);
    expect(result[0].autoDetected).toBe(false);
  });

  it('round-trips multiple patterns', () => {
    const second: Pattern = {
      ...samplePattern,
      id: 'pat-002',
      pattern: 'Use PascalCase for classes',
      examples: [{ good: 'MyClass.ts' }],
    };
    const md = serializePatterns([samplePattern, second]);
    const result = parsePatterns(md);
    expect(result.length).toBe(2);
    expect(result[1].examples[0].good).toBe('MyClass.ts');
    expect(result[1].examples[0].bad).toBeUndefined();
  });
});
