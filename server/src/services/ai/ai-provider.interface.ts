import type { AiHealthStatus } from '@sevasetu/shared';

export interface AIGenerationOptions {
  timeoutMs?: number;
  maxOutputTokens?: number;
  temperature?: number;
  systemInstruction?: string;
  responseSchema?: Record<string, unknown>;
}

export interface AITextResponse {
  text: string;
  tokensUsed?: number;
  latencyMs: number;
  model: string;
  provider: string;
}

export interface AIStructuredResponse<T> {
  data: T;
  rawText: string;
  tokensUsed?: number;
  latencyMs: number;
  model: string;
  provider: string;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  generateText(prompt: string, options?: AIGenerationOptions): Promise<AITextResponse>;
  generateStructuredOutput<T>(
    prompt: string,
    schemaValidator: (rawJson: unknown) => T,
    options?: AIGenerationOptions
  ): Promise<AIStructuredResponse<T>>;
  healthCheck(): Promise<AiHealthStatus>;
}
