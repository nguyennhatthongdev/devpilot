import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '../src/commands/review.js';
import { resolve, relative, isAbsolute } from 'path';

describe('sanitizeFilename', () => {
  it('keeps safe characters unchanged', () => {
    expect(sanitizeFilename('my-file_v2.0')).toBe('my-file_v2.0');
  });

  it('replaces special characters with dashes', () => {
    expect(sanitizeFilename('file@name#1!')).toBe('file-name-1-');
  });

  it('removes leading dots', () => {
    expect(sanitizeFilename('...hidden')).toBe('hidden');
  });

  it('truncates to 200 characters', () => {
    const longName = 'a'.repeat(300);
    expect(sanitizeFilename(longName).length).toBe(200);
  });

  it('handles unicode characters', () => {
    expect(sanitizeFilename('café-résumé')).toBe('caf--r-sum-');
  });
});

describe('path traversal prevention', () => {
  it('blocks parent directory traversal', () => {
    const rootPath = '/project';
    const target = resolve('/project/../../etc/passwd');
    const relPath = relative(rootPath, target);
    expect(relPath.startsWith('..')).toBe(true);
  });

  it('allows paths within project', () => {
    const rootPath = '/project';
    const target = resolve('/project/src/index.ts');
    const relPath = relative(rootPath, target);
    expect(relPath.startsWith('..')).toBe(false);
    expect(isAbsolute(relPath)).toBe(false);
  });

  it('blocks absolute resolved paths outside project', () => {
    const rootPath = '/project';
    const target = resolve('/etc/passwd');
    const relPath = relative(rootPath, target);
    expect(relPath.startsWith('..')).toBe(true);
  });
});
