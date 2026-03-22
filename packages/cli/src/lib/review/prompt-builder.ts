import { ReviewContext } from './types.js';

export class PromptBuilder {
  buildSystemPrompt(context: ReviewContext): string {
    const techStack = (context.projectContext as Record<string, unknown>).techStack ?? {};
    const stats = (context.projectContext as Record<string, unknown>).stats as Record<string, unknown> | undefined;

    let prompt = `You are an expert code reviewer focused on code quality, maintainability, and best practices.

Your task: review code and provide:
1. Issues found (categorized: critical, medium, minor)
2. Specific suggestions for improvement
3. Quality score (0-100)

## Project Context
Tech Stack: ${JSON.stringify(techStack)}
Total Files: ${stats?.totalFiles ?? 'unknown'}
Languages: ${Object.keys((stats?.languages as Record<string, unknown>) ?? {}).join(', ')}

## Architecture Decisions
`;

    for (const dec of context.decisions.slice(0, 5)) {
      prompt += `- ${dec.title}: ${dec.decision}\n`;
    }

    prompt += '\n## Coding Patterns to Enforce\n';
    for (const pat of context.patterns.slice(0, 10)) {
      prompt += `- ${pat.pattern}\n`;
      if (pat.examples[0]?.good) prompt += `  Good: ${pat.examples[0].good}\n`;
      if (pat.examples[0]?.bad) prompt += `  Bad: ${pat.examples[0].bad}\n`;
    }

    prompt += `
## Output Format (use exactly)

# Code Review

## Issues Found

### Critical
[list critical issues with line numbers]

### Medium
[list medium severity issues]

### Minor
[list minor improvements]

## Suggestions
[actionable suggestions for improvement]

## Patterns Analysis
Followed: [patterns correctly followed]
Violated: [patterns violated]

## Quality Score
[score]/100

**Rationale:** [brief explanation]
`;

    return prompt;
  }

  buildUserPrompt(context: ReviewContext): string {
    return `Review the following file:

**File:** ${context.filePath}
**Lines of Code:** ${context.fileContent.split('\n').length}

\`\`\`
${context.fileContent}
\`\`\`

Provide a thorough review following the guidelines.`;
  }
}
