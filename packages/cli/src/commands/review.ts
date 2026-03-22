import ora from 'ora';
import chalk from 'chalk';
import { RunReviewAction } from '../actions/run-review.js';

export async function reviewCommand(target: string, options: { model?: string }) {
  const spinner = ora('Preparing review...').start();

  try {
    const rootPath = process.cwd();
    const action = new RunReviewAction();

    // Validate target and get files
    const validateResult = await action.validateTarget(target, rootPath);

    if (!validateResult.success) {
      spinner.fail(chalk.red('Review failed'));
      console.error(chalk.red(validateResult.error));
      if (validateResult.error?.includes('within project directory')) {
        console.error(chalk.dim('Hint: Use relative paths like ./src/file.ts'));
      }
      process.exit(1);
    }

    const files = validateResult.data!;
    spinner.succeed(chalk.green(`Found ${files.length} file(s) to review`));

    const formatter = action.getFormatter();

    for (const file of files) {
      console.log(chalk.blue(`\n--- Reviewing ${file} ---\n`));

      // Stream review
      const stream = action.streamReview(file, rootPath, options);

      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          process.stdout.write(chunk);
        } else {
          // Final result
          console.log('\n');
          formatter.formatTerminal(chunk.result);
          console.log(chalk.dim(`\nReview saved to ${chunk.savedPath}`));
        }
      }
    }

    console.log(chalk.green(`\n✓ Review complete for ${files.length} file(s)`));
  } catch (error: unknown) {
    spinner.fail(chalk.red('Review failed'));
    console.error((error as Error).message);
    process.exit(1);
  }
}
