import { HealthScore } from './types.js';

export class MarkdownExporter {
  generate(score: HealthScore): string {
    const status = (s: number) => s >= 80 ? 'OK' : s >= 60 ? 'WARN' : 'FAIL';

    let md = `# Project Health Report\n\n`;
    md += `**Generated:** ${new Date(score.scannedAt).toLocaleString()}\n`;
    md += `**Overall Score:** ${score.overallScore}/100`;
    if (score.trend) md += ` (${score.trend})`;
    md += `\n\n`;

    // Summary table
    md += `## Summary\n\n`;
    md += `| Metric | Score | Status |\n`;
    md += `|--------|-------|--------|\n`;

    const b = score.breakdown;
    md += `| Complexity | ${b.complexity.score}/100 | ${status(b.complexity.score)} |\n`;
    md += `| Duplication | ${b.duplication.score}/100 | ${status(b.duplication.score)} |\n`;
    md += `| Dependencies | ${b.dependencies.score}/100 | ${status(b.dependencies.score)} |\n`;
    md += `| File Size | ${b.fileSize.score}/100 | ${status(b.fileSize.score)} |\n`;

    if (score.testCoverage) {
      const tc = score.testCoverage;
      const vals = [tc.lines, tc.statements, tc.functions];
      if (!tc.branchesUnavailable) vals.push(tc.branches);
      const avg = vals.reduce((a, v) => a + v, 0) / vals.length;
      md += `| Test Coverage | ${avg.toFixed(1)}% | ${status(avg)} |\n`;
    }

    if (score.security) {
      md += `| Security | ${score.security.total} vulns | ${status(score.security.total === 0 ? 100 : score.security.total < 5 ? 70 : 30)} |\n`;
    }

    if (b.styleConsistency) md += `| Style Consistency | ${b.styleConsistency.score}/100 | ${status(b.styleConsistency.score)} |\n`;
    if (b.deadCode) md += `| Dead Code | ${b.deadCode.score}/100 | ${status(b.deadCode.score)} |\n`;
    if (b.todos) md += `| TODOs | ${b.todos.score}/100 | ${status(b.todos.score)} |\n`;
    if (b.docCoverage) md += `| Doc Coverage | ${b.docCoverage.score}/100 | ${status(b.docCoverage.score)} |\n`;
    if (b.importCycles) md += `| Import Cycles | ${b.importCycles.score}/100 | ${status(b.importCycles.score)} |\n`;

    md += `\n`;

    // Top issues
    md += `## Top Issues\n\n`;

    if (b.complexity.complexFiles && b.complexity.complexFiles.length > 0) {
      md += `### Complexity\n\n`;
      b.complexity.complexFiles.slice(0, 5).forEach(f => {
        md += `- \`${f.file}\`: ${f.complexity}\n`;
      });
      md += `\n`;
    }

    if (b.duplication.percentage > 5) {
      md += `### Duplication\n\n`;
      md += `- ${b.duplication.percentage}% duplicated (${b.duplication.duplicatedLines} lines)\n\n`;
    }

    if (score.security && score.security.vulnerabilities.critical > 0) {
      md += `### Security\n\n`;
      md += `- ${score.security.vulnerabilities.critical} critical vulnerabilities\n`;
      md += `- ${score.security.vulnerabilities.high} high vulnerabilities\n\n`;
    }

    if (b.todos && b.todos.total > 0) {
      md += `### TODOs\n\n`;
      md += `- ${b.todos.total} total (${b.todos.byPriority.critical} critical, ${b.todos.byPriority.high} high)\n\n`;
    }

    return md;
  }
}
