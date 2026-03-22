import { ConfigManager } from '../lib/config-manager.js';
import { ProviderManager } from '../lib/llm/provider-manager.js';
import { PROVIDER_MODELS, type ProviderName } from '../lib/llm/types.js';
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
  const configManager = new ConfigManager();

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

    if (!key.trim()) {
      console.error(chalk.red('API key cannot be empty'));
      process.exit(1);
    }

    const config = await configManager.loadGlobalConfig();
    config.apiKeys[provider as keyof typeof config.apiKeys] = key.trim();

    // Set as default model if first key configured
    if (!config.defaultModel) {
      config.defaultModel = PROVIDER_MODELS[provider as ProviderName][0];
    }

    await configManager.saveGlobalConfig(config);
    console.log(chalk.green(`✓ API key saved for ${provider}`));

  } else if (options.testKey) {
    const provider = options.testKey.toLowerCase() as ProviderName;
    const config = await configManager.loadGlobalConfig();
    const key = config.apiKeys[provider as keyof typeof config.apiKeys];

    if (!key) {
      console.error(chalk.red(`No key configured for ${provider}`));
      process.exit(1);
    }

    const spinner = ora(`Testing ${provider} API key...`).start();
    const providerManager = new ProviderManager();
    const isValid = await providerManager.validateKey(provider, key);

    if (isValid) {
      spinner.succeed(chalk.green(`✓ ${provider} key is valid`));
    } else {
      spinner.fail(chalk.red(`${provider} key is invalid`));
      process.exit(1);
    }

  } else if (options.setModel) {
    const config = await configManager.loadGlobalConfig();
    config.defaultModel = options.setModel;
    await configManager.saveGlobalConfig(config);
    console.log(chalk.green(`✓ Default model set to ${options.setModel}`));

  } else {
    // Show current config (list-keys or default)
    const config = await configManager.loadGlobalConfig();
    console.log(chalk.blue('\nConfigured Providers:'));

    const configuredProviders = Object.entries(config.apiKeys)
      .filter(([, key]) => key);

    if (configuredProviders.length > 0) {
      for (const [provider, key] of configuredProviders) {
        const masked = key!.slice(0, 8) + '...' + key!.slice(-4);
        console.log(`  ${provider}: ${chalk.dim(masked)}`);
      }
    } else {
      console.log(chalk.dim('  No API keys configured'));
    }

    if (config.defaultModel) {
      console.log(chalk.blue('\nDefault Model:'));
      console.log(`  ${config.defaultModel}`);
    }
  }
}
