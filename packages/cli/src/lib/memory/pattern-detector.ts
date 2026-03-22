import { ContextData } from '../scanner/types.js';
import { Pattern } from './types.js';

type PatternInput = Omit<Pattern, 'id' | 'usageCount' | 'lastUsed'>;

export class PatternDetector {
  detectPatterns(contextData: ContextData): PatternInput[] {
    const patterns: PatternInput[] = [];
    const fileNames = contextData.fileStructure.largestFiles.map(f => {
      const parts = f.path.split('/');
      return parts[parts.length - 1];
    });

    // Detect naming convention
    const kebab = fileNames.filter(f => /^[a-z0-9]+(-[a-z0-9]+)*\.[a-z]+$/.test(f));
    const camel = fileNames.filter(f => /^[a-z]+[A-Z][a-zA-Z]*\.[a-z]+$/.test(f));

    if (kebab.length > camel.length && kebab.length >= 3) {
      patterns.push({
        pattern: 'Use kebab-case for file names',
        scope: 'all',
        autoDetected: true,
        examples: [{ good: kebab[0] }],
        tags: ['naming', 'conventions'],
      });
    } else if (camel.length >= 3) {
      patterns.push({
        pattern: 'Use camelCase for file names',
        scope: 'all',
        autoDetected: true,
        examples: [{ good: camel[0] }],
        tags: ['naming', 'conventions'],
      });
    }

    // Detect component directory pattern
    const paths = contextData.fileStructure.largestFiles.map(f => f.path);
    if (paths.some(f => f.includes('src/components/'))) {
      patterns.push({
        pattern: 'Component files in src/components/',
        scope: 'all',
        autoDetected: true,
        examples: [],
        tags: ['structure'],
      });
    }

    // Detect TypeScript usage
    if (contextData.techStack.language === 'typescript') {
      patterns.push({
        pattern: 'Use TypeScript for all source files',
        scope: 'all',
        autoDetected: true,
        examples: [{ good: 'file.ts', bad: 'file.js' }],
        tags: ['language', 'conventions'],
      });
    }

    return patterns;
  }
}
