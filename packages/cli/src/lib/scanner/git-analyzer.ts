import { access } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { GitStats } from './types.js';

const execAsync = promisify(exec);

export class GitAnalyzer {
  constructor(private projectRoot: string) {}

  async analyze(): Promise<GitStats | undefined> {
    // Check if git repo
    try {
      await access(join(this.projectRoot, '.git'));
    } catch {
      return undefined;
    }

    // Check if git CLI available
    try {
      await execAsync('git --version', { timeout: 2000 });
    } catch {
      console.warn('Git CLI not available, skipping git stats');
      return undefined;
    }

    try {
      const [commits, contributors, branches, currentBranch, firstCommit, lastCommit, commitsPerWeek] =
        await Promise.all([
          this.getCommitCount(),
          this.getContributorCount(),
          this.getBranchCount(),
          this.getCurrentBranch(),
          this.getFirstCommitDate(),
          this.getLastCommitDate(),
          this.getCommitsPerWeek(),
        ]);

      return { commits, contributors, branches, currentBranch, firstCommit, lastCommit, commitsPerWeek };
    } catch (error) {
      console.warn('Failed to collect git stats:', error);
      return undefined;
    }
  }

  private async getCommitCount(): Promise<number> {
    const { stdout } = await execAsync('git rev-list --count HEAD', {
      cwd: this.projectRoot, timeout: 10000,
    });
    return parseInt(stdout.trim(), 10) || 0;
  }

  private async getContributorCount(): Promise<number> {
    // macOS/Linux only — shell pipes for deduplication
    const { stdout } = await execAsync('git log --format="%ae" | sort -u | wc -l', {
      cwd: this.projectRoot, timeout: 10000, shell: '/bin/bash',
    });
    return parseInt(stdout.trim(), 10) || 0;
  }

  private async getBranchCount(): Promise<number> {
    const { stdout } = await execAsync('git branch -a | wc -l', {
      cwd: this.projectRoot, timeout: 10000, shell: '/bin/bash',
    });
    return parseInt(stdout.trim(), 10) || 0;
  }

  private async getCurrentBranch(): Promise<string> {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
      cwd: this.projectRoot, timeout: 5000,
    });
    return stdout.trim() || 'unknown';
  }

  private async getFirstCommitDate(): Promise<string> {
    const { stdout } = await execAsync('git log --reverse --format="%ai" | head -1', {
      cwd: this.projectRoot, timeout: 10000, shell: '/bin/bash',
    });
    return this.parseGitDate(stdout.trim());
  }

  private async getLastCommitDate(): Promise<string> {
    const { stdout } = await execAsync('git log -1 --format="%ai"', {
      cwd: this.projectRoot, timeout: 5000,
    });
    return this.parseGitDate(stdout.trim());
  }

  private async getCommitsPerWeek(): Promise<number> {
    const { stdout } = await execAsync('git log --since="8 weeks ago" --format="%ai" | wc -l', {
      cwd: this.projectRoot, timeout: 10000, shell: '/bin/bash',
    });
    const commitsLast8Weeks = parseInt(stdout.trim(), 10) || 0;
    return Math.round((commitsLast8Weeks / 8) * 10) / 10;
  }

  private parseGitDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }
}
