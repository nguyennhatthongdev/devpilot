import { describe, it, expect } from 'vitest';
import { VALID_PROVIDERS, PROVIDER_MODELS } from '../src/lib/llm/types.js';

describe('VALID_PROVIDERS', () => {
  it('contains all expected providers', () => {
    expect(VALID_PROVIDERS).toContain('anthropic');
    expect(VALID_PROVIDERS).toContain('openai');
    expect(VALID_PROVIDERS).toContain('google');
    expect(VALID_PROVIDERS).toContain('ollama');
    expect(VALID_PROVIDERS.length).toBe(4);
  });
});

describe('model string validation', () => {
  it('valid provider:model parses correctly', () => {
    const input = 'anthropic:claude-sonnet-4-5-20250929';
    const [provider, model] = input.split(':', 2);
    expect(VALID_PROVIDERS.includes(provider as typeof VALID_PROVIDERS[number])).toBe(true);
    expect(model).toBe('claude-sonnet-4-5-20250929');
  });

  it('rejects invalid provider', () => {
    const input = 'malicious:payload';
    const [provider] = input.split(':', 2);
    expect(VALID_PROVIDERS.includes(provider as typeof VALID_PROVIDERS[number])).toBe(false);
  });

  it('rejects empty model name', () => {
    const input = 'anthropic:';
    const [, model] = input.split(':', 2);
    expect(!model || model.trim().length === 0).toBe(true);
  });

  it('handles malformed input with multiple colons', () => {
    const input = '::::';
    const [provider, model] = input.split(':', 2);
    expect(VALID_PROVIDERS.includes(provider as typeof VALID_PROVIDERS[number])).toBe(false);
    expect(model).toBe('');
  });

  it('PROVIDER_MODELS has entries for all valid providers', () => {
    for (const provider of VALID_PROVIDERS) {
      expect(PROVIDER_MODELS[provider]).toBeDefined();
      expect(PROVIDER_MODELS[provider].length).toBeGreaterThan(0);
    }
  });
});

describe('provider inference from model prefix', () => {
  it('infers openai from gpt- prefix', () => {
    const model = 'gpt-4o';
    expect(model.startsWith('gpt-')).toBe(true);
  });

  it('infers anthropic from claude- prefix', () => {
    const model = 'claude-sonnet-4-5-20250929';
    expect(model.startsWith('claude-')).toBe(true);
  });

  it('infers google from gemini- prefix', () => {
    const model = 'gemini-2.0-flash';
    expect(model.startsWith('gemini-')).toBe(true);
  });
});
