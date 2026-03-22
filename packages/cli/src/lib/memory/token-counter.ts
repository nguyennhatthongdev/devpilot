import { encode } from 'gpt-tokenizer';

export class TokenCounter {
  count(text: string): number {
    return encode(text).length;
  }

  estimateMemoryTokens(decisions: { title: string; decision: string; rationale: string }[], patterns: { pattern: string; examples: unknown[] }[]): number {
    const decisionsText = decisions
      .map(d => `${d.title} ${d.decision} ${d.rationale}`)
      .join(' ');

    const patternsText = patterns
      .map(p => `${p.pattern} ${JSON.stringify(p.examples)}`)
      .join(' ');

    return this.count(decisionsText + patternsText);
  }
}
