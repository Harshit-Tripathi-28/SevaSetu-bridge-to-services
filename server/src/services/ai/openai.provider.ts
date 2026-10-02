import type { AIProvider, AIGenerationOptions, AITextResponse, AIStructuredResponse } from './ai-provider.interface.js';
import {
  AIConfigurationError,
  AITimeoutError,
  AIRateLimitError,
  AIProviderError,
  AIOutputValidationError,
} from './ai.errors.js';
import type { AiHealthStatus } from '@sevasetu/shared';

export class OpenAIProvider implements AIProvider {
  public readonly id = 'OPENAI';
  public readonly name = 'OpenAI';

  private readonly apiKey?: string;
  private readonly model: string;
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxTokens: number;

  constructor(options: {
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
    maxOutputTokens?: number;
  } = {}) {
    this.apiKey = options.apiKey?.trim();
    this.model = options.model || 'gpt-4o-mini';
    this.defaultTimeoutMs = options.timeoutMs || 15000;
    this.defaultMaxTokens = options.maxOutputTokens || 2048;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  public async generateText(prompt: string, options?: AIGenerationOptions): Promise<AITextResponse> {
    if (!this.isConfigured()) {
      throw new AIConfigurationError('OpenAI is not configured. Please supply AI_API_KEY in server environment.');
    }

    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (options?.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxOutputTokens || this.defaultMaxTokens,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new AIRateLimitError('OpenAI rate limit exceeded.');
        }
        throw new AIProviderError(`OpenAI request failed (${response.status}): ${errorText}`);
      }

      const json = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const text = json.choices?.[0]?.message?.content || '';
      const tokensUsed = json.usage?.total_tokens;

      return {
        text,
        tokensUsed,
        latencyMs,
        model: this.model,
        provider: this.id,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AITimeoutError(`OpenAI request timed out after ${timeoutMs}ms.`);
      }
      if (err instanceof Error && 'code' in err && (err as { code: string }).code?.startsWith('AI_')) {
        throw err;
      }
      throw new AIProviderError(
        `OpenAI provider error: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async generateStructuredOutput<T>(
    prompt: string,
    schemaValidator: (rawJson: unknown) => T,
    options?: AIGenerationOptions
  ): Promise<AIStructuredResponse<T>> {
    if (!this.isConfigured()) {
      throw new AIConfigurationError('OpenAI is not configured. Please supply AI_API_KEY in server environment.');
    }

    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (options?.systemInstruction) {
        messages.push({
          role: 'system',
          content: `${options.systemInstruction}\nYou MUST output valid RFC 8259 JSON only.`,
        });
      } else {
        messages.push({
          role: 'system',
          content: 'You are a structured data extractor. You MUST output valid RFC 8259 JSON only.',
        });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          response_format: { type: 'json_object' },
          temperature: options?.temperature ?? 0.1,
          max_tokens: options?.maxOutputTokens || this.defaultMaxTokens,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new AIRateLimitError('OpenAI rate limit exceeded.');
        }
        throw new AIProviderError(`OpenAI structured request failed (${response.status}): ${errorText}`);
      }

      const json = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const rawText = json.choices?.[0]?.message?.content || '{}';
      const tokensUsed = json.usage?.total_tokens;

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseErr) {
        throw new AIOutputValidationError(`Malformed JSON from OpenAI model: ${String(parseErr)}`, { rawText });
      }

      let validated: T;
      try {
        validated = schemaValidator(parsed);
      } catch (valErr) {
        throw new AIOutputValidationError(
          `AI output schema validation failed: ${valErr instanceof Error ? valErr.message : String(valErr)}`,
          { rawJson: parsed }
        );
      }

      return {
        data: validated,
        rawText,
        tokensUsed,
        latencyMs,
        model: this.model,
        provider: this.id,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AITimeoutError(`OpenAI structured request timed out after ${timeoutMs}ms.`);
      }
      if (err instanceof Error && 'code' in err && (err as { code: string }).code?.startsWith('AI_')) {
        throw err;
      }
      throw new AIProviderError(
        `OpenAI provider error: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async healthCheck(): Promise<AiHealthStatus> {
    const configured = this.isConfigured();
    return {
      configured,
      provider: this.id,
      model: this.model,
      operationalState: configured ? 'operational' : 'unconfigured',
      timeoutMs: this.defaultTimeoutMs,
      maxOutputTokens: this.defaultMaxTokens,
      enabled: true,
    };
  }
}
