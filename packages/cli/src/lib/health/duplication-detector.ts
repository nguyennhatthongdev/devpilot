import { readFile } from 'fs/promises';
import { DuplicationMetrics } from './types.js';

// Simple line-based duplication detector for MVP
// Finds repeated blocks of 5+ consecutive identical lines across files
const MIN_BLOCK_SIZE = 5;

export class DuplicationDetector {
  async detect(files: string[]): Promise<DuplicationMetrics> {
    const lineHashes = new Map<string, number>(); // hash -> count
    let totalLines = 0;
    let duplicatedLines = 0;

    for (const file of files) {
      if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;

      try {
        const content = await readFile(file, 'utf-8');
        const lines = content.split('\n');
        totalLines += lines.length;

        // Check blocks of MIN_BLOCK_SIZE lines
        for (let i = 0; i <= lines.length - MIN_BLOCK_SIZE; i++) {
          const block = lines.slice(i, i + MIN_BLOCK_SIZE)
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('*'))
            .join('\n');

          if (block.length < 20) continue; // Skip trivial blocks

          const count = lineHashes.get(block) ?? 0;
          lineHashes.set(block, count + 1);
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Count duplicated lines (blocks seen more than once)
    for (const [block, count] of lineHashes) {
      if (count > 1) {
        duplicatedLines += block.split('\n').length * (count - 1);
      }
    }

    const percentage = totalLines > 0 ? Math.round((duplicatedLines / totalLines) * 1000) / 10 : 0;

    let score = 100;
    if (percentage > 15) score = 20;
    else if (percentage > 10) score = 40;
    else if (percentage > 5) score = 60;
    else if (percentage > 2) score = 80;

    return { score, percentage, duplicatedLines, totalLines };
  }
}
