import { ReviewResult, ReviewIssue } from './types.js';

export class ReviewParser {
  parse(reviewText: string, filePath: string, model: string): ReviewResult {
    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];
    const patternsFollowed: string[] = [];
    const patternsViolated: string[] = [];
    let score = 0;

    // Extract issues by severity
    this.extractIssues(reviewText, /### Critical\s+([\s\S]*?)(?=###|##|$)/, 'critical', issues);
    this.extractIssues(reviewText, /### Medium\s+([\s\S]*?)(?=###|##|$)/, 'medium', issues);
    this.extractIssues(reviewText, /### Minor\s+([\s\S]*?)(?=###|##|$)/, 'minor', issues);

    // Extract suggestions
    const sugMatch = reviewText.match(/## Suggestions\s+([\s\S]*?)(?=##|$)/);
    if (sugMatch) {
      sugMatch[1].split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          suggestions.push(trimmed.replace(/^[-*]\s*/, ''));
        }
      });
    }

    // Extract patterns
    const patMatch = reviewText.match(/## Patterns Analysis\s+([\s\S]*?)(?=##|$)/);
    if (patMatch) {
      const text = patMatch[1];
      const followedMatch = text.match(/Followed:\s*(.+)/);
      const violatedMatch = text.match(/Violated:\s*(.+)/);
      if (followedMatch) patternsFollowed.push(...this.splitItems(followedMatch[1]));
      if (violatedMatch) patternsViolated.push(...this.splitItems(violatedMatch[1]));
    }

    // Extract score
    const scoreMatch = reviewText.match(/(\d+)\/100/);
    if (scoreMatch) score = parseInt(scoreMatch[1]);

    return {
      filePath,
      date: new Date().toISOString().split('T')[0],
      model,
      score,
      issues,
      suggestions,
      patternsFollowed,
      patternsViolated,
    };
  }

  private extractIssues(
    text: string,
    pattern: RegExp,
    severity: ReviewIssue['severity'],
    issues: ReviewIssue[],
  ): void {
    const match = text.match(pattern);
    if (!match) return;
    match[1].split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const lineMatch = trimmed.match(/\(line (\d+)\)/);
        issues.push({
          severity,
          message: trimmed.replace(/^[-*]\s*/, ''),
          line: lineMatch ? parseInt(lineMatch[1]) : undefined,
        });
      }
    });
  }

  private splitItems(text: string): string[] {
    return text.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }
}
