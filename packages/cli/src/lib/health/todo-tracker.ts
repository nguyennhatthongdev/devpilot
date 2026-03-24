import { BaseAnalyzer } from './base-analyzer.js';
import { TodoMetrics } from './types.js';
import { detectLanguage, LANGUAGE_CONFIGS } from './language-config.js';

const PRIORITIES: Record<string, 0 | 1 | 2 | 3> = {
  FIXME: 3, BUG: 3,
  HACK: 2, XXX: 2,
  TODO: 1,
  OPTIMIZE: 0, NOTE: 0, TEMP: 0,
};

const TODO_PATTERN = /(TODO|FIXME|HACK|XXX|BUG|NOTE|OPTIMIZE|TEMP)\s*(?:\(([^)]+)\))?\s*(?:\[(\d{4}-\d{2}-\d{2})\])?\s*[:\s]+(.+)$/i;

export class TodoTracker extends BaseAnalyzer<TodoMetrics> {
  async analyze(files: string[], _rootPath: string): Promise<TodoMetrics> {
    const items: TodoMetrics['items'] = [];
    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const file of this.filterCodeFiles(files)) {
      const lang = detectLanguage(file);
      if (!lang) continue;

      const content = await this.readFileSafe(file);
      if (!content) continue;

      const lines = content.split('\n');
      const commentPrefixes = LANGUAGE_CONFIGS[lang].lineComment;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!commentPrefixes.some(p => line.startsWith(p))) continue;

        const match = line.match(TODO_PATTERN);
        if (!match) continue;

        const type = match[1].toUpperCase();
        const priority = PRIORITIES[type] ?? 1;

        items.push({
          type,
          priority: priority as any,
          file,
          line: i + 1,
          message: match[4].trim(),
          author: match[2] || undefined,
          date: match[3] || undefined,
        });

        if (priority === 3) byPriority.critical++;
        else if (priority === 2) byPriority.high++;
        else if (priority === 1) byPriority.medium++;
        else byPriority.low++;
      }
    }

    // Score: penalize high-priority items more
    const weighted = byPriority.critical * 10 + byPriority.high * 5 + byPriority.medium * 2 + byPriority.low * 1;
    const score = Math.max(0, 100 - weighted);
    const oldest = this.findOldest(items);

    return { score, total: items.length, byPriority, oldest, items: items.slice(0, 50) };
  }

  private findOldest(items: TodoMetrics['items']): TodoMetrics['oldest'] {
    const withDates = items.filter(i => i.date);
    if (withDates.length === 0) return undefined;

    const sorted = withDates.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
    const oldest = sorted[0];
    const age = Math.floor((Date.now() - new Date(oldest.date!).getTime()) / (1000 * 60 * 60 * 24));

    return { file: oldest.file, line: oldest.line, age, message: oldest.message };
  }
}
