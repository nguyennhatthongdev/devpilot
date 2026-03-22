import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import YAML from 'yaml';
import type { FastifyInstance } from 'fastify';
import { getDevpilotPaths } from '../file-utils.js';
import { parseDecisions, parsePatterns } from '../memory/markdown-parser.js';

export function registerApiRoutes(app: FastifyInstance, projectRoot: string) {
  const paths = getDevpilotPaths(projectRoot);

  app.get('/api/health', async () => {
    try {
      const content = await readFile(paths.localHealth, 'utf-8');
      return YAML.parse(content);
    } catch {
      return { error: 'No health data. Run: devpilot health' };
    }
  });

  app.get('/api/context', async () => {
    try {
      const content = await readFile(paths.context, 'utf-8');
      return YAML.parse(content);
    } catch {
      return { error: 'No context data. Run: devpilot scan' };
    }
  });

  app.get('/api/memory', async () => {
    try {
      const [decisionsRaw, patternsRaw] = await Promise.all([
        readFile(paths.sharedDecisions, 'utf-8').catch(() => '# Decisions\n'),
        readFile(paths.sharedPatterns, 'utf-8').catch(() => '# Patterns\n'),
      ]);
      return {
        decisions: parseDecisions(decisionsRaw),
        patterns: parsePatterns(patternsRaw),
      };
    } catch {
      return { decisions: [], patterns: [] };
    }
  });

  app.get('/api/reviews', async () => {
    try {
      const files = await readdir(paths.localReviews);
      const reviews = await Promise.all(
        files.filter(f => f.endsWith('.md')).map(async (file) => {
          const content = await readFile(join(paths.localReviews, file), 'utf-8');
          const scoreMatch = content.match(/Quality Score:\*?\*?\s*(\d+)\/100/);
          return {
            filename: file,
            score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
            content,
          };
        }),
      );
      return reviews;
    } catch {
      return [];
    }
  });
}
