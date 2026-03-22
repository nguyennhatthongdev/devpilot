import { type ProviderName } from '../lib/llm/types.js';
import { ManageConfigAction } from '../actions/manage-config.js';
import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'readline';

const VALID_PROVIDERS = ['anthropic', 'openai', 'google', 'ollama'] as const;

export async function configCommand(options: {
  setKey?: string;
  listKeys?: boolean;
  testKey?: string;
  setModel?: string;
}) {
  const action = new ManageConfigAction();

  if (options.setKey) {
    const provider = options.setKey.toLowerCase();
    if (!VALID_PROVIDERS.includes(provider as ProviderName)) {
      console.error(chalk.red(`Invalid provider: ${provider}. Use: ${VALID_PROVIDERS.join(', ')}`));
      process.exit(1);
    }

    if (provider === 'ollama') {
      console.log(chalk.green('✓ Ollama uses local models, no API key needed'));
      return;
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const key = await new Promise<string>((resolve) => {
      rl.question(`Enter ${provider} API key: `, resolve);
    });
    rl.close();

    const result = await action.setApiKey(provider as ProviderName, key);

    if (!result.success) {
      console.error(chalk.red(result.error));
      process.exit(1);
    }

    console.log(chalk.green(`✓ API key saved for ${provider}`));

  } else if (options.testKey) {
    const provider = options.testKey.toLowerCase() as ProviderName;
    const spinner = ora(`Testing ${provider} API key...`).start();

    const result = await action.testApiKey(provider);

    if (!result.success) {
      spinner.fail(chalk.red(result.error));
      process.exit(1);
    }

    if (result.data!.valid) {
      spinner.succeed(chalk.green(`✓ ${provider} key is valid`));
    } else {
      spinner.fail(chalk.red(`${provider} key is invalid`));
      process.exit(1);
    }

  } else if (options.setModel) {
    const result = await action.setModel(options.setModel);

    if (!result.success) {
      console.error(chalk.red(result.error));
      process.exit(1);
    }

    console.log(chalk.green(`✓ Default model set to ${options.setModel}`));

  } else {
    // Show current config (list-keys or default)
    const result = await action.getConfig();

    if (!result.success) {
      console.error(chalk.red(result.error));
      process.exit(1);
    }

    const { apiKeys, defaultModel } = result.data!;
    console.log(chalk.blue('\nConfigured Providers:'));

    const configuredProviders = Object.entries(apiKeys).filter(([, key]) => key);

    if (configuredProviders.length > 0) {
      for (const [provider, key] of configuredProviders) {
        const masked = key!.slice(0, 8) + '...' + key!.slice(-4);
        console.log(`  ${provider}: ${chalk.dim(masked)}`);
      }
    } else {
      console.log(chalk.dim('  No API keys configured'));
    }

    if (defaultModel) {
      console.log(chalk.blue('\nDefault Model:'));
      console.log(`  ${defaultModel}`);
    }
  }
}
