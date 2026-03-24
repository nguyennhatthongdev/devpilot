import { readFile } from 'fs/promises';
import { DuplicationMetrics } from './types.js';
import { detectLanguage, LANGUAGE_CONFIGS } from './language-config.js';

// Finds repeated blocks of 5+ consecutive identical lines across files
const MIN_BLOCK_SIZE = 5;

export class DuplicationDetector {
  async detect(files: string[]): Promise<DuplicationMetrics> {
    const blockHashes = new Map<string, number>();
    let totalLines = 0;

    for (const file of files) {
      const lang = detectLanguage(file);
      if (!lang) continue;

      try {
        const content = await readFile(file, 'utf-8');
        const commentPrefixes = LANGUAGE_CONFIGS[lang].lineComment;
        const lines = content.split('\n');
        totalLines += lines.length;

        // Non-overlapping blocks (step = MIN_BLOCK_SIZE)
        for (let i = 0; i <= lines.length - MIN_BLOCK_SIZE; i += MIN_BLOCK_SIZE) {
          const block = lines.slice(i, i + MIN_BLOCK_SIZE)
            .map(l => l.trim())
            .filter(l => l.length > 0 && !commentPrefixes.some(p => l.startsWith(p)) && !l.startsWith('*'))
            .join('\n');

          if (block.length < 20) continue;

          const count = blockHashes.get(block) ?? 0;
          blockHashes.set(block, count + 1);
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Count duplicate blocks (seen more than once)
    let duplicateBlockCount = 0;
    for (const count of blockHashes.values()) {
      if (count > 1) duplicateBlockCount++;
    }

    // Use actual hashed block count instead of estimated total
    const totalBlocks = blockHashes.size;
    const percentage = totalBlocks > 0
      ? Math.round((duplicateBlockCount / totalBlocks) * 1000) / 10
      : 0;
    const duplicatedLines = duplicateBlockCount * MIN_BLOCK_SIZE;

    let score = 100;
    if (percentage > 15) score = 20;
    else if (percentage > 10) score = 40;
    else if (percentage > 5) score = 60;
    else if (percentage > 2) score = 80;

    return { score, percentage, duplicatedLines, totalLines };
  }
}
