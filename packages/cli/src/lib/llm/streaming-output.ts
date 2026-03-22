import { stdout } from 'process';
import chalk from 'chalk';

export class StreamingOutput {
  async displayStream(stream: AsyncGenerator<string>): Promise<string> {
    let fullText = '';
    for await (const chunk of stream) {
      fullText += chunk;
      stdout.write(chunk);
    }
    stdout.write('\n');
    return fullText;
  }

  displayThinking(message: string): void {
    console.log(chalk.dim(`  ${message}`));
  }

  displayError(error: string): void {
    console.error(chalk.red(`Error: ${error}`));
  }

  displaySuccess(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }
}
