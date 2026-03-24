export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const VALID_PROVIDERS = ['anthropic', 'openai', 'google', 'ollama'] as const;

export type ProviderName = (typeof VALID_PROVIDERS)[number];

export const PROVIDER_MODELS: Record<ProviderName, string[]> = {
  anthropic: ['claude-sonnet-4-5-20250929', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'],
  google: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest'],
  ollama: ['llama3.3', 'qwen2.5', 'deepseek-r1'],
};

export const DEFAULT_MODEL: Record<ProviderName, string> = {
  anthropic: 'claude-sonnet-4-5-20250929',
  openai: 'gpt-4o',
  google: 'gemini-2.5-flash',
  ollama: 'llama3.3',
};
