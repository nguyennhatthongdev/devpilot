import { ConfigManager } from '../lib/config-manager.js';
import { ProviderManager } from '../lib/llm/provider-manager.js';
import { PROVIDER_MODELS, type ProviderName } from '../lib/llm/types.js';
import { ActionResult } from './types.js';

export interface ConfigData {
  apiKeys: Record<string, string | undefined>;
  defaultModel?: string;
}

export interface SetKeyResult {
  provider: string;
  firstKey: boolean;
  defaultModel?: string;
}

export class ManageConfigAction {
  private configManager: ConfigManager;
  private providerManager: ProviderManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.providerManager = new ProviderManager();
  }

  async setApiKey(provider: ProviderName, key: string): Promise<ActionResult<SetKeyResult>> {
    try {
      if (!key.trim()) {
        return {
          success: false,
          error: 'API key cannot be empty',
        };
      }

      const config = await this.configManager.loadGlobalConfig();
      (config.apiKeys as Record<string, string | undefined>)[provider] = key.trim();

      // Set as default model if first key configured
      const isFirstKey = !config.defaultModel;
      if (isFirstKey) {
        config.defaultModel = PROVIDER_MODELS[provider][0];
      }

      await this.configManager.saveGlobalConfig(config);

      return {
        success: true,
        data: {
          provider,
          firstKey: isFirstKey,
          defaultModel: isFirstKey ? config.defaultModel : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save API key',
      };
    }
  }

  async testApiKey(provider: ProviderName): Promise<ActionResult<{ valid: boolean }>> {
    try {
      const config = await this.configManager.loadGlobalConfig();
      const key = (config.apiKeys as Record<string, string | undefined>)[provider];

      if (!key) {
        return {
          success: false,
          error: `No key configured for ${provider}`,
        };
      }

      const isValid = await this.providerManager.validateKey(provider, key);

      return {
        success: true,
        data: { valid: isValid },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test API key',
      };
    }
  }

  async setModel(model: string): Promise<ActionResult<{ model: string }>> {
    try {
      const config = await this.configManager.loadGlobalConfig();
      config.defaultModel = model;
      await this.configManager.saveGlobalConfig(config);

      return {
        success: true,
        data: { model },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set model',
      };
    }
  }

  async getConfig(): Promise<ActionResult<ConfigData>> {
    try {
      const config = await this.configManager.loadGlobalConfig();
      return {
        success: true,
        data: {
          apiKeys: config.apiKeys,
          defaultModel: config.defaultModel,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load config',
      };
    }
  }
}
