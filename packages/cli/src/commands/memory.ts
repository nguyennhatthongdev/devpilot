import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { MemoryManager } from '../lib/memory/memory-manager.js';
import { TokenCounter } from '../lib/memory/token-counter.js';

export async function memoryCommand(
  action: string,
  options: { type?: string },
) {
  const memoryManager = new MemoryManager();

  switch (action) {
    case 'list': {
      const decisions = await memoryManager.getDecisions();
      const patterns = await memoryManager.getPatterns();

      console.log(chalk.blue('\nArchitecture Decisions:'));
      if (decisions.length === 0) {
        console.log(chalk.dim('  No decisions recorded'));
      } else {
        decisions.forEach(d => {
          console.log(`  [${d.id}] ${d.title}`);
          console.log(chalk.dim(`       ${d.decision}`));
        });
      }

      console.log(chalk.blue('\nCoding Patterns:'));
      if (patterns.length === 0) {
        console.log(chalk.dim('  No patterns detected'));
      } else {
        patterns.forEach(p => {
          const auto = p.autoDetected ? chalk.dim(' (auto)') : '';
          console.log(`  [${p.id}] ${p.pattern}${auto}`);
        });
      }
      break;
    }

    case 'add': {
      if (options.type === 'decision') {
        const title = await input({ message: 'Decision title:' });
        const context = await input({ message: 'Context:' });
        const decision = await input({ message: 'Decision made:' });
        const rationale = await input({ message: 'Rationale:' });
        const tagsInput = await input({ message: 'Tags (comma-separated):' });

        await memoryManager.addDecision({
          date: new Date().toISOString().split('T')[0],
          title,
          context,
          decision,
          rationale,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        });
        console.log(chalk.green('✓ Decision added'));
      } else if (options.type === 'pattern') {
        const pattern = await input({ message: 'Pattern description:' });
        const scope = await input({ message: 'Scope (all/specific):' });
        const goodExample = await input({ message: 'Good example (optional):' });
        const badExample = await input({ message: 'Bad example (optional):' });
        const tagsInput = await input({ message: 'Tags (comma-separated):' });

        const examples = [];
        if (goodExample || badExample) {
          examples.push({
            good: goodExample || undefined,
            bad: badExample || undefined,
          });
        }

        await memoryManager.addPattern({
          pattern,
          scope,
          autoDetected: false,
          examples,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        });
        console.log(chalk.green('✓ Pattern added'));
      } else {
        console.error(chalk.red('Specify --type decision or --type pattern'));
        process.exit(1);
      }
      break;
    }

    case 'prune': {
      const strategy = await select({
        message: 'Pruning strategy:',
        choices: [
          { name: 'Time-based (>90 days old)', value: 'time' as const },
          { name: 'Usage-based (unused only)', value: 'usage' as const },
        ],
      });

      const proceed = await confirm({ message: 'Proceed with pruning?' });
      if (proceed) {
        const pruned = await memoryManager.pruneMemories(strategy);
        console.log(chalk.green(`✓ Pruned ${pruned} memories`));
      }
      break;
    }

    case 'tokens': {
      const tokenCounter = new TokenCounter();
      const decisions = await memoryManager.getDecisions();
      const patterns = await memoryManager.getPatterns();
      const tokenCount = tokenCounter.estimateMemoryTokens(decisions, patterns);

      console.log(chalk.blue('\nToken Estimate:'));
      console.log(`  Memory tokens: ${tokenCount.toLocaleString()}`);
      console.log(`  Decisions: ${decisions.length}`);
      console.log(`  Patterns: ${patterns.length}`);
      break;
    }

    default:
      console.error(chalk.red(`Unknown action: ${action}. Use: list, add, prune, tokens`));
      process.exit(1);
  }
}
