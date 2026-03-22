import { join, basename } from 'path';
import { writeFile, mkdir, stat, readdir } from 'fs/promises';
import ora from 'ora';
import chalk from 'chalk';
import { ProviderManager } from '../lib/llm/provider-manager.js';
import { ReviewContextBuilder } from '../lib/review/review-context-builder.js';
import { PromptBuilder } from '../lib/review/prompt-builder.js';
import { ReviewParser } from '../lib/review/review-parser.js';
import { ReviewFormatter } from '../lib/review/review-formatter.js';
import { getDevpilotPaths } from '../lib/file-utils.js';

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.swift', '.kt']);

export async function reviewCommand(target: string, options: { model?: string }) {
  const spinner = ora('Preparing review...').start();

  try {
    const rootPath = process.cwd();
    const paths = getDevpilotPaths(rootPath);

    // Determine files to review
    const targetStat = await stat(target);
    let files: string[];

    if (targetStat.isDirectory()) {
      const entries = await readdir(target, { recursive: true });
      files = entries
        .map(f => join(target, f as string))
        .filter(f => CODE_EXTENSIONS.has(f.slice(f.lastIndexOf('.'))));
    } else {
      files = [target];
    }

    if (files.length === 0) {
      spinner.fail(chalk.red('No code files found to review'));
      return;
    }

    spinner.succeed(chalk.green(`Found ${files.length} file(s) to review`));

    // Initialize components
    const contextBuilder = new ReviewContextBuilder();
    const promptBuilder = new PromptBuilder();
    const reviewParser = new ReviewParser();
    const reviewFormatter = new ReviewFormatter();
    const providerManager = new ProviderManager();

    for (const file of files) {
      console.log(chalk.blue(`\n--- Reviewing ${file} ---\n`));

      // Build context and prompts
      const context = await contextBuilder.build(file, rootPath);
      const systemPrompt = promptBuilder.buildSystemPrompt(context);
      const userPrompt = promptBuilder.buildUserPrompt(context);

      // Generate review via LLM streaming
      let fullReviewText = '';
      const stream = providerManager.stream(userPrompt, {
        model: options.model,
        systemPrompt,
        maxTokens: 4096,
      });

      for await (const chunk of stream) {
        fullReviewText += chunk;
        process.stdout.write(chunk);
      }
      console.log('\n');

      // Parse and display formatted summary
      const result = reviewParser.parse(fullReviewText, file, options.model || 'default');
      reviewFormatter.formatTerminal(result);

      // Save review
      await mkdir(paths.localReviews, { recursive: true });
      const reviewFileName = `${result.date}-${basename(file).replace(/\.[^.]+$/, '')}.md`;
      const reviewPath = join(paths.localReviews, reviewFileName);
      const markdown = reviewFormatter.formatMarkdown(result, fullReviewText);
      await writeFile(reviewPath, markdown);

      console.log(chalk.dim(`\nReview saved to ${reviewPath}`));
    }

    console.log(chalk.green(`\n✓ Review complete for ${files.length} file(s)`));
  } catch (error: unknown) {
    spinner.fail(chalk.red('Review failed'));
    console.error((error as Error).message);
    process.exit(1);
  }
}
