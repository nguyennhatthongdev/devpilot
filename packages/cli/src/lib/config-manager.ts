import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import YAML from 'yaml';

export interface Config {
  apiKeys: {
    anthropic?: string;
    openai?: string;
    google?: string;
  };
  defaultModel?: string;
  projectDefaults: {
    excludePatterns: string[];
    scanDepth: number;
  };
}

export class ConfigManager {
  private globalConfigDir = join(homedir(), '.devpilot');
  private globalConfigPath = join(homedir(), '.devpilot', 'config.yaml');

  getProjectConfigPath(projectRoot: string = process.cwd()): string {
    return join(projectRoot, '.devpilot', 'shared', 'config.yaml');
  }

  async loadGlobalConfig(): Promise<Config> {
    try {
      const content = await readFile(this.globalConfigPath, 'utf-8');
      return YAML.parse(content) ?? this.getDefaultConfig();
    } catch {
      return this.getDefaultConfig();
    }
  }

  async saveGlobalConfig(config: Config): Promise<void> {
    await mkdir(this.globalConfigDir, { recursive: true });
    await writeFile(this.globalConfigPath, YAML.stringify(config));
  }

  async loadProjectConfig(projectRoot: string = process.cwd()): Promise<Partial<Config>> {
    try {
      const content = await readFile(this.getProjectConfigPath(projectRoot), 'utf-8');
      return YAML.parse(content) ?? {};
    } catch {
      return {};
    }
  }

  async mergeConfigs(projectRoot: string = process.cwd()): Promise<Config> {
    const global = await this.loadGlobalConfig();
    const project = await this.loadProjectConfig(projectRoot);
    return { ...global, ...project };
  }

  private getDefaultConfig(): Config {
    return {
      apiKeys: {},
      projectDefaults: {
        excludePatterns: ['node_modules', '.git', 'dist', 'build', 'coverage'],
        scanDepth: 10,
      },
    };
  }
}
