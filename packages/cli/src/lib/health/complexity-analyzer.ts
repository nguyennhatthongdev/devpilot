import { readFile } from 'fs/promises';
import { ComplexityMetrics } from './types.js';
import { detectLanguage, getComplexityPattern, LANGUAGE_CONFIGS } from './language-config.js';

export class ComplexityAnalyzer {
  private threshold = 10;

  async analyze(files: string[]): Promise<ComplexityMetrics> {
    const complexities: number[] = [];
    const complexFiles: Array<{ file: string; complexity: number }> = [];

    for (const file of files) {
      const lang = detectLanguage(file);
      if (!lang) continue;

      try {
        const content = await readFile(file, 'utf-8');
        const stripped = this.stripCommentsAndStrings(content, lang);
        const pattern = getComplexityPattern(lang);
        const matches = stripped.match(pattern);
        const lines = content.split('\n').length;
        const complexity = lines > 0 ? Math.round(((matches?.length ?? 0) / lines) * 100 * 10) / 10 : 0;
        complexities.push(complexity);

        if (complexity > this.threshold) {
          complexFiles.push({ file, complexity });
        }
      } catch {
        // Skip unreadable files
      }
    }

    const avg = complexities.length > 0
      ? Math.round((complexities.reduce((a, b) => a + b, 0) / complexities.length) * 10) / 10
      : 0;
    const max = complexities.length > 0 ? Math.max(...complexities) : 0;

    let score = 100;
    if (avg > 20) score = 20;
    else if (avg > 15) score = 40;
    else if (avg > 10) score = 60;
    else if (avg > 5) score = 80;

    return {
      score,
      avgCyclomaticComplexity: avg,
      filesOverThreshold: complexFiles.length,
      maxComplexity: Math.round(max),
      complexFiles: complexFiles.sort((a, b) => b.complexity - a.complexity).slice(0, 5),
    };
  }

  // Strip comments and string literals, preserving template literal expressions ${...}
  private stripCommentsAndStrings(content: string, lang: string): string {
    const config = LANGUAGE_CONFIGS[lang];
    if (!config) return content;

    let result = '';
    let inString = false;
    let stringChar = '';
    let inLineComment = false;
    let inBlockComment = false;
    let escaped = false;
    let templateDepth = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const next = content[i + 1];

      if (inString && escaped) { escaped = false; continue; }

      if (inString) {
        if (char === '\\') { escaped = true; continue; }
        // Template literal: preserve ${...} expressions
        if (stringChar === '`' && char === '$' && next === '{') {
          templateDepth++;
          inString = false;
          result += '  ';
          i++;
          continue;
        }
        if (char === stringChar) inString = false;
        result += ' ';
        continue;
      }

      if (templateDepth > 0) {
        if (char === '{') { templateDepth++; result += char; continue; }
        if (char === '}') {
          templateDepth--;
          if (templateDepth === 0) { inString = true; stringChar = '`'; result += ' '; continue; }
          result += char;
          continue;
        }
      }

      if (inBlockComment) {
        if (config.blockComment && char === config.blockComment.end[0] && next === config.blockComment.end[1]) {
          inBlockComment = false; i++;
        }
        result += char === '\n' ? '\n' : ' ';
        continue;
      }

      if (inLineComment) {
        if (char === '\n') { inLineComment = false; result += '\n'; }
        else result += ' ';
        continue;
      }

      // Detect line comments
      const isLineComment = config.lineComment.some(prefix => {
        for (let j = 0; j < prefix.length; j++) {
          if (content[i + j] !== prefix[j]) return false;
        }
        return true;
      });
      if (isLineComment) {
        inLineComment = true;
        i += config.lineComment[0].length - 1;
        result += ' '.repeat(config.lineComment[0].length);
        continue;
      }

      // Detect block comments
      if (config.blockComment) {
        const bs = config.blockComment.start;
        if (char === bs[0] && next === bs[1]) {
          inBlockComment = true; i++;
          result += '  ';
          continue;
        }
      }

      // String literals (python uses """ but we handle single-line for simplicity)
      if (char === '"' || char === "'" || (lang === 'javascript' && char === '`')) {
        inString = true;
        stringChar = char;
        result += ' ';
        continue;
      }

      result += char;
    }

    return result;
  }
}
