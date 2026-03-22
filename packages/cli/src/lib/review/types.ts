export interface ReviewContext {
  projectContext: Record<string, unknown>;
  decisions: { title: string; decision: string }[];
  patterns: { pattern: string; examples: { good?: string; bad?: string }[] }[];
  fileContent: string;
  filePath: string;
}

export interface ReviewIssue {
  severity: 'critical' | 'medium' | 'minor';
  message: string;
  line?: number;
}

export interface ReviewResult {
  filePath: string;
  date: string;
  model: string;
  score: number;
  issues: ReviewIssue[];
  suggestions: string[];
  patternsFollowed: string[];
  patternsViolated: string[];
}
