import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileWalker } from '../src/lib/scanner/file-walker.js';

describe('FileWalker', () => {
  let tempDir: string;
  let walker: FileWalker;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'devpilot-walker-'));
    walker = new FileWalker();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('counts lines correctly', async () => {
    const filePath = join(tempDir, 'test.ts');
    await writeFile(filePath, 'line1\nline2\nline3\n');
    const count = await walker.countLines(filePath);
    expect(count).toBe(4); // trailing newline = extra empty line
  });

  it('returns 0 for missing files', async () => {
    const count = await walker.countLines(join(tempDir, 'nonexistent.ts'));
    expect(count).toBe(0);
  });

  it('walks directory and returns file paths', async () => {
    await writeFile(join(tempDir, 'a.ts'), 'content');
    await mkdir(join(tempDir, 'sub'));
    await writeFile(join(tempDir, 'sub', 'b.ts'), 'content');

    const files = await walker.walk(tempDir);
    expect(files.length).toBe(2);
    expect(files.some(f => f.endsWith('a.ts'))).toBe(true);
    expect(files.some(f => f.endsWith('b.ts'))).toBe(true);
  });

  it('returns file size correctly', async () => {
    const filePath = join(tempDir, 'sized.txt');
    await writeFile(filePath, 'hello'); // 5 bytes
    const size = await walker.getFileSize(filePath);
    expect(size).toBe(5);
  });
});
