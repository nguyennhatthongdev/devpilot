import chalk from 'chalk';
import { HealthScore } from './types.js';

export class HealthReporter {
  display(health: HealthScore): void {
    const scoreColor = health.overallScore >= 80 ? chalk.green :
                       health.overallScore >= 60 ? chalk.yellow : chalk.red;

    console.log(chalk.bold('\nProject Health Report'));
    console.log(chalk.dim(`Scanned: ${health.scannedAt}\n`));
    console.log(scoreColor(`Overall Score: ${health.overallScore}/100`));

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
  }

  private colorScore(score: number): string {
    if (score >= 80) return chalk.green(String(score));
    if (score >= 60) return chalk.yellow(String(score));
    return chalk.red(String(score));
  }
}
