import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import YAML from 'yaml';
import { ConfigManager } from '../src/lib/config-manager.js';

describe('ConfigManager', () => {
  let tempDir: string;
  let manager: ConfigManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'devpilot-test-'));
    manager = new ConfigManager();
    // Override private paths for testing
    Object.defineProperty(manager, 'globalConfigDir', { value: tempDir });
    Object.defineProperty(manager, 'globalConfigPath', { value: join(tempDir, 'config.yaml') });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns default config when no file exists', async () => {
    const config = await manager.loadGlobalConfig();
    expect(config.apiKeys).toEqual({});
    expect(config.projectDefaults.excludePatterns).toContain('node_modules');
  });

  it('saves config with restricted file permissions (0600)', async () => {
    const config = await manager.loadGlobalConfig();
    config.apiKeys.anthropic = 'test-key-123';
    await manager.saveGlobalConfig(config);

    const fileStat = await stat(join(tempDir, 'config.yaml'));
    const fileMode = fileStat.mode & 0o777;
    expect(fileMode).toBe(0o600);
  });

  it('saves config with restricted directory permissions (0700)', async () => {
    const config = await manager.loadGlobalConfig();
    await manager.saveGlobalConfig(config);

    const dirStat = await stat(tempDir);
    const dirMode = dirStat.mode & 0o777;
    expect(dirMode).toBe(0o700);
  });

  it('persists and loads config correctly', async () => {
    const config = await manager.loadGlobalConfig();
    config.apiKeys.openai = 'sk-test-key';
    config.defaultModel = 'gpt-4o';
    await manager.saveGlobalConfig(config);

    const loaded = await manager.loadGlobalConfig();
    expect(loaded.apiKeys.openai).toBe('sk-test-key');
    expect(loaded.defaultModel).toBe('gpt-4o');
  });
});
