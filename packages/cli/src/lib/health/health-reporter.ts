import chalk from 'chalk';
import { HealthScore } from './types.js';

export class HealthReporter {
  display(health: HealthScore): void {
    const scoreColor = health.overallScore >= 80 ? chalk.green :
                       health.overallScore >= 60 ? chalk.yellow : chalk.red;

    console.log(chalk.bold('\nProject Health Report'));
    console.log(chalk.dim(`Scanned: ${health.scannedAt}\n`));
    console.log(scoreColor(`Overall Score: ${health.overallScore}/100 (${this.getGrade(health.overallScore)})`));

    if (health.trend) {
      const icon = health.trend === 'improving' ? 'UP' : health.trend === 'declining' ? 'DOWN' : '--';
      console.log(chalk.dim(`Trend: [${icon}] ${health.trend}`));
    }

    console.log(chalk.blue('\nBreakdown:\n'));

    console.log(chalk.bold('Complexity'));
    console.log(`  Score: ${this.colorScore(health.breakdown.complexity.score)}/100`);
    console.log(`  Avg Complexity: ${health.breakdown.complexity.avgCyclomaticComplexity}`);
    console.log(`  Files Over Threshold: ${health.breakdown.complexity.filesOverThreshold}`);

    console.log(chalk.bold('\nCode Duplication'));
    console.log(`  Score: ${this.colorScore(health.breakdown.duplication.score)}/100`);
    console.log(`  Duplication: ${health.breakdown.duplication.percentage}%`);
    console.log(`  Duplicated Lines: ${health.breakdown.duplication.duplicatedLines.toLocaleString()}`);

    console.log(chalk.bold('\nDependencies'));
    console.log(`  Score: ${this.colorScore(health.breakdown.dependencies.score)}/100`);
    console.log(`  Total: ${health.breakdown.dependencies.total}`);
    console.log(`  Outdated: ${health.breakdown.dependencies.outdated}`);

    console.log(chalk.bold('\nFile Size'));
    console.log(`  Score: ${this.colorScore(health.breakdown.fileSize.score)}/100`);
    console.log(`  Avg Lines: ${health.breakdown.fileSize.avgSize}`);
    console.log(`  Large Files (>500 lines): ${health.breakdown.fileSize.largeFiles}`);

    if (health.testCoverage) {
      const tc = health.testCoverage;
      const values = [tc.lines, tc.statements, tc.functions];
      if (!tc.branchesUnavailable) values.push(tc.branches);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      console.log(chalk.bold('\nTest Coverage'));
      console.log(`  Runner: ${tc.runner || 'Unknown'}`);
      console.log(`  Lines: ${tc.lines.toFixed(1)}%`);
      console.log(`  Statements: ${tc.statements.toFixed(1)}%`);
      console.log(`  Branches: ${tc.branches.toFixed(1)}%${tc.branchesUnavailable ? ' (N/A)' : ''}`);
      console.log(`  Functions: ${tc.functions.toFixed(1)}%`);
      console.log(`  Average: ${this.colorScore(Math.round(avg))}/100`);
    }

    if (health.security) {
      const sec = health.security;
      console.log(chalk.bold('\nSecurity'));
      console.log(`  Total Vulnerabilities: ${sec.total}`);
      if (sec.total > 0) {
        if (sec.vulnerabilities.critical > 0) console.log(chalk.red(`  Critical: ${sec.vulnerabilities.critical}`));
        if (sec.vulnerabilities.high > 0) console.log(chalk.yellow(`  High: ${sec.vulnerabilities.high}`));
        if (sec.vulnerabilities.moderate > 0) console.log(chalk.yellow(`  Moderate: ${sec.vulnerabilities.moderate}`));
        if (sec.vulnerabilities.low > 0) console.log(`  Low: ${sec.vulnerabilities.low}`);
        if (sec.vulnerabilities.info > 0) console.log(`  Info: ${sec.vulnerabilities.info}`);
      } else {
        console.log(chalk.green('  No vulnerabilities found'));
      }
    }

    // Phase 3 analyzers
    if (health.breakdown.styleConsistency) {
      const sc = health.breakdown.styleConsistency;
      console.log(chalk.bold('\nStyle Consistency'));
      console.log(`  Score: ${this.colorScore(sc.score)}/100`);
      console.log(`  Dominant: ${sc.dominantStyle}`);
      console.log(`  Inconsistent Files: ${sc.inconsistentFiles.length}`);
    }

    if (health.breakdown.deadCode) {
      const dc = health.breakdown.deadCode;
      console.log(chalk.bold('\nDead Code'));
      console.log(`  Score: ${this.colorScore(dc.score)}/100`);
      console.log(`  Unused Exports: ${dc.unusedExports}`);
      console.log(`  Unused Files: ${dc.unusedFiles}`);
    }

    if (health.breakdown.todos) {
      const td = health.breakdown.todos;
      console.log(chalk.bold('\nTODO/FIXME'));
      console.log(`  Score: ${this.colorScore(td.score)}/100`);
      console.log(`  Total: ${td.total}`);
      if (td.total > 0) {
        console.log(`  Critical: ${td.byPriority.critical} | High: ${td.byPriority.high} | Medium: ${td.byPriority.medium} | Low: ${td.byPriority.low}`);
      }
    }

    if (health.breakdown.docCoverage) {
      const doc = health.breakdown.docCoverage;
      console.log(chalk.bold('\nDoc Coverage'));
      console.log(`  Score: ${this.colorScore(doc.score)}/100`);
      console.log(`  Coverage: ${doc.coverage.toFixed(1)}% (${doc.documented}/${doc.publicFunctions})`);
    }

    if (health.breakdown.importCycles) {
      const ic = health.breakdown.importCycles;
      console.log(chalk.bold('\nImport Cycles'));
      console.log(`  Score: ${this.colorScore(ic.score)}/100`);
      console.log(`  Cycles Found: ${ic.cycleCount}`);
    }
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private colorScore(score: number): string {
    if (score >= 80) return chalk.green(String(score));
    if (score >= 60) return chalk.yellow(String(score));
    return chalk.red(String(score));
  }
}
