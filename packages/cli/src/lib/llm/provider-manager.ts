import { generateText, streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';
import { ConfigManager } from '../config-manager.js';
import { GenerateOptions, LLMResponse, ProviderName, PROVIDER_MODELS, DEFAULT_MODEL } from './types.js';

export class ProviderManager {
  private configManager = new ConfigManager();

  async generate(prompt: string, options: GenerateOptions = {}): Promise<LLMResponse> {
    const { provider, model } = await this.resolveProviderAndModel(options.model);
    const apiKey = await this.getApiKey(provider);
    const llmModel = this.createModel(provider, model, apiKey);

    const result = await generateText({
      model: llmModel,
      prompt,
      system: options.systemPrompt,
      maxTokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
    });

    return {
      text: result.text,
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
    };
  }

  async *stream(prompt: string, options: GenerateOptions = {}): AsyncGenerator<string> {
    const { provider, model } = await this.resolveProviderAndModel(options.model);
    const apiKey = await this.getApiKey(provider);
    const llmModel = this.createModel(provider, model, apiKey);

    const result = streamText({
      model: llmModel,
      prompt,
      system: options.systemPrompt,
      maxTokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }

  async validateKey(provider: ProviderName, apiKey: string): Promise<boolean> {
    try {
      const llmModel = this.createModel(provider, DEFAULT_MODEL[provider], apiKey);
      await generateText({
        model: llmModel,
        prompt: 'Say "ok"',
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  private createModel(provider: ProviderName, model: string, apiKey?: string) {
    switch (provider) {
      case 'anthropic':
        return createAnthropic({ apiKey })(model);
      case 'openai':
        return createOpenAI({ apiKey })(model);
      case 'google':
        return createGoogleGenerativeAI({ apiKey })(model);
      case 'ollama':
        return ollama(model);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async resolveProviderAndModel(modelString?: string): Promise<{
    provider: ProviderName;
    model: string;
  }> {
    if (modelString) {
      // Parse "provider:model" format
      if (modelString.includes(':')) {
        const [provider, model] = modelString.split(':') as [ProviderName, string];
        return { provider, model };
      }
      // Infer provider from model name
      for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
        if (models.includes(modelString)) {
          return { provider: provider as ProviderName, model: modelString };
        }
      }
      // Assume it's a custom model name, try anthropic first
      return { provider: 'anthropic', model: modelString };
    }

    // Use default from config
    const config = await this.configManager.loadGlobalConfig();
    if (config.defaultModel) {
      return this.resolveProviderAndModel(config.defaultModel);
    }

    // Fallback: pick first configured provider
    for (const provider of ['anthropic', 'openai', 'google'] as ProviderName[]) {
      if (config.apiKeys[provider as keyof typeof config.apiKeys]) {
        return { provider, model: DEFAULT_MODEL[provider] };
      }
    }

    return { provider: 'anthropic', model: DEFAULT_MODEL.anthropic };
  }

  private async getApiKey(provider: ProviderName): Promise<string | undefined> {
    if (provider === 'ollama') return undefined;

    // Check env vars first
    const envVarMap: Record<string, string> = {
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      google: 'GOOGLE_GENERATIVE_AI_API_KEY',
    };

    const envKey = process.env[envVarMap[provider]];
    if (envKey) return envKey;

    // Then check config
    const config = await this.configManager.loadGlobalConfig();
    const key = config.apiKeys[provider as keyof typeof config.apiKeys];

    if (!key) {
      throw new Error(
        `No API key for ${provider}. Set via: devpilot config --set-key ${provider}\n` +
        `Or set env var: ${envVarMap[provider]}`
      );
    }

    return key;
  }
}
