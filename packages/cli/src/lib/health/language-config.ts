export interface LanguageConfig {
  extensions: string[];
  complexityKeywords: string[];
  complexityOperators: string[];
  lineComment: string[];
  blockComment?: { start: string; end: string };
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    complexityKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch'],
    complexityOperators: ['&&', '||', '?', '??'],
    lineComment: ['//'],
    blockComment: { start: '/*', end: '*/' },
  },
  python: {
    extensions: ['.py'],
    complexityKeywords: ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'and', 'or', 'with'],
    complexityOperators: [],
    lineComment: ['#'],
  },
  go: {
    extensions: ['.go'],
    complexityKeywords: ['if', 'else', 'for', 'switch', 'case', 'select'],
    complexityOperators: ['&&', '||'],
    lineComment: ['//'],
    blockComment: { start: '/*', end: '*/' },
  },
  rust: {
    extensions: ['.rs'],
    complexityKeywords: ['if', 'else', 'match', 'while', 'loop', 'for'],
    complexityOperators: ['&&', '||', '?'],
    lineComment: ['//'],
    blockComment: { start: '/*', end: '*/' },
  },
  java: {
    extensions: ['.java'],
    complexityKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch'],
    complexityOperators: ['&&', '||', '?'],
    lineComment: ['//'],
    blockComment: { start: '/*', end: '*/' },
  },
};

/** Detect language from file path extension */
export function detectLanguage(filepath: string): string | undefined {
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
    if (config.extensions.some(ext => filepath.endsWith(ext))) {
      return lang;
    }
  }
  return undefined;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build a combined regex for keyword+operator complexity matching */
export function getComplexityPattern(lang: string): RegExp {
  const config = LANGUAGE_CONFIGS[lang];
  if (!config) return /(?!)/g; // never matches

  const parts: string[] = [];

  if (config.complexityKeywords.length > 0) {
    parts.push(`\\b(${config.complexityKeywords.join('|')})\\b`);
  }

  if (config.complexityOperators.length > 0) {
    const opPattern = config.complexityOperators.map(escapeRegex).join('|');
    parts.push(opPattern);
  }

  return new RegExp(parts.join('|'), 'g');
}
