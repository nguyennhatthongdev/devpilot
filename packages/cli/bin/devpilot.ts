#!/usr/bin/env node
import { program } from 'commander';
import { initCommand } from '../src/commands/init.js';
import { configCommand } from '../src/commands/config.js';
import { scanCommand } from '../src/commands/scan.js';
import { memoryCommand } from '../src/commands/memory.js';
import { reviewCommand } from '../src/commands/review.js';
import { healthCommand } from '../src/commands/health.js';
import { dashboardCommand } from '../src/commands/dashboard.js';

program
  .name('devpilot')
  .description('AI Dev Copilot with persistent project memory')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize DevPilot in current project')
  .action(initCommand);

program
  .command('config')
  .description('Manage configuration')
  .option('--set-key <provider>', 'Set API key for provider (anthropic|openai|google|ollama)')
  .option('--list-keys', 'List configured API keys')
  .option('--test-key <provider>', 'Validate API key for provider')
  .option('--set-model <model>', 'Set default LLM model')
  .action(configCommand);

program
  .command('scan')
  .description('Scan codebase and analyze structure')
  .option('-d, --depth <number>', 'max directory depth')
  .option('-e, --exclude <patterns>', 'additional exclude patterns (comma-separated)')
  .option('--full', 'bypass cache, full rescan')
  .action(scanCommand);

program
  .command('memory')
  .description('Manage project memory')
  .argument('<action>', 'list | add | prune | tokens')
  .option('-t, --type <type>', 'decision | pattern (for add command)')
  .action(memoryCommand);

program
  .command('review')
  .description('AI-powered code review')
  .argument('<target>', 'file or directory to review')
  .option('-m, --model <name>', 'LLM model to use')
  .action(reviewCommand);

program
  .command('health')
  .description('Analyze project health and generate quality score')
  .action(healthCommand);

program
  .command('dashboard')
  .description('Launch web dashboard')
  .action(dashboardCommand);

program.parse();
