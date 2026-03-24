import type { Decision, Pattern } from './types.js';

// --- Decisions ---

function serializeField(key: string, value: string | undefined): string {
  const safeValue = value || '';
  if (!safeValue.includes('\n')) {
    return `- **${key}:** ${safeValue}\n`;
  }
  const lines = safeValue.split('\n');
  let result = `- **${key}:** ${lines[0]}\n`;
  for (const line of lines.slice(1)) {
    result += `  ${line}\n`;
  }
  return result;
}

export function serializeDecisions(decisions: Decision[]): string {
  let md = '# Decisions\n';
  for (const d of decisions) {
    md += `\n## ${d.id}: ${d.title}\n`;
    md += `- **Date:** ${d.date}\n`;
    md += serializeField('Context', d.context);
    md += serializeField('Decision', d.decision);
    md += serializeField('Rationale', d.rationale);
    md += `- **Tags:** ${d.tags.join(', ')}\n`;
    md += `- **Usage Count:** ${d.usageCount}\n`;
    md += `- **Last Used:** ${d.lastUsed}\n`;
  }
  return md;
}

export function parseDecisions(markdown: string): Decision[] {
  const decisions: Decision[] = [];
  const sections = markdown.split(/^## /m).slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const headerMatch = lines[0].match(/^(dec-\d+):\s*(.+)$/);
    if (!headerMatch) continue;

    const fields = extractFields(lines.slice(1));
    decisions.push({
      id: headerMatch[1],
      title: headerMatch[2].trim(),
      date: fields['Date'] ?? '',
      context: fields['Context'] ?? '',
      decision: fields['Decision'] ?? '',
      rationale: fields['Rationale'] ?? '',
      tags: parseCommaSeparated(fields['Tags']),
      usageCount: parseInt(fields['Usage Count'] ?? '0', 10),
      lastUsed: fields['Last Used'] ?? '',
    });
  }
  return decisions;
}

// --- Patterns ---

export function serializePatterns(patterns: Pattern[]): string {
  let md = '# Patterns\n';
  for (const p of patterns) {
    md += `\n## ${p.id}: ${p.pattern}\n`;
    md += `- **Scope:** ${p.scope}\n`;
    md += `- **Auto Detected:** ${p.autoDetected}\n`;
    md += `- **Tags:** ${p.tags.join(', ')}\n`;
    md += `- **Usage Count:** ${p.usageCount}\n`;
    md += `- **Last Used:** ${p.lastUsed}\n`;
    if (p.examples.length > 0) {
      md += `\n### Examples\n`;
      for (const ex of p.examples) {
        if (ex.good) md += `- Good: \`${ex.good}\`\n`;
        if (ex.bad) md += `- Bad: \`${ex.bad}\`\n`;
      }
    }
  }
  return md;
}

export function parsePatterns(markdown: string): Pattern[] {
  const patterns: Pattern[] = [];
  const sections = markdown.split(/^## /m).slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const headerMatch = lines[0].match(/^(pat-\d+):\s*(.+)$/);
    if (!headerMatch) continue;

    const fields = extractFields(lines.slice(1));
    const examples = parseExamples(section);

    patterns.push({
      id: headerMatch[1],
      pattern: headerMatch[2].trim(),
      scope: fields['Scope'] ?? 'all',
      autoDetected: fields['Auto Detected'] === 'true',
      tags: parseCommaSeparated(fields['Tags']),
      usageCount: parseInt(fields['Usage Count'] ?? '0', 10),
      lastUsed: fields['Last Used'] ?? '',
      examples,
    });
  }
  return patterns;
}

// --- Helpers ---

function extractFields(lines: string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  let currentKey = '';

  for (const line of lines) {
    const match = line.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
    if (match) {
      currentKey = match[1];
      fields[currentKey] = match[2].trim();
    } else if (currentKey && line.match(/^  \S/)) {
      fields[currentKey] += ' ' + line.trim();
    } else {
      currentKey = '';
    }
  }
  return fields;
}

function parseCommaSeparated(value: string | undefined): string[] {
  if (!value || value.trim() === '') return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function parseExamples(section: string): { good?: string; bad?: string }[] {
  const examplesMatch = section.split(/^### Examples$/m);
  if (examplesMatch.length < 2) return [];

  const exampleLines = examplesMatch[1].split('\n').filter(l => l.startsWith('- '));
  const examples: { good?: string; bad?: string }[] = [];
  let current: { good?: string; bad?: string } = {};

  for (const line of exampleLines) {
    const goodMatch = line.match(/^- Good: `(.+)`$/);
    const badMatch = line.match(/^- Bad: `(.+)`$/);
    if (goodMatch) {
      if (current.bad) {
        examples.push(current);
        current = {};
      }
      current.good = goodMatch[1];
    } else if (badMatch) {
      current.bad = badMatch[1];
      examples.push(current);
      current = {};
    }
  }
  if (current.good || current.bad) examples.push(current);
  return examples;
}
