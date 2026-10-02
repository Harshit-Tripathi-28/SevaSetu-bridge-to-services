import type { AIProvider, AIGenerationOptions, AITextResponse, AIStructuredResponse } from './ai-provider.interface.js';
import {
  AIConfigurationError,
  AITimeoutError,
  AIRateLimitError,
  AIProviderError,
  AIOutputValidationError,
} from './ai.errors.js';
import type { AiHealthStatus } from '@sevasetu/shared';

export class GeminiProvider implements AIProvider {
  public readonly id = 'GEMINI';
  public readonly name = 'Google Gemini';

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
    this.model = options.model || 'gemini-1.5-flash';
    this.defaultTimeoutMs = options.timeoutMs || 15000;
    this.defaultMaxTokens = options.maxOutputTokens || 2048;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  public async generateText(prompt: string, options?: AIGenerationOptions): Promise<AITextResponse> {
    if (!this.isConfigured()) {
      throw new AIConfigurationError('Google Gemini is not configured. Please supply AI_API_KEY in server environment.');
    }

    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];
      if (options?.systemInstruction) {
        contents.push({ role: 'user', parts: [{ text: `[SYSTEM INSTRUCTION]\n${options.systemInstruction}` }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. I will strictly follow this instruction.' }] });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.2,
            maxOutputTokens: options?.maxOutputTokens || this.defaultMaxTokens,
          },
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new AIRateLimitError('Google Gemini rate limit exceeded.');
        }
        if (response.status === 400 || response.status === 403) {
          throw new AIProviderError(`Google Gemini request failed (${response.status}): ${errorText}`);
        }
        throw new AIProviderError(`Google Gemini service error (${response.status}): ${errorText}`);
      }

      const json = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { totalTokenCount?: number };
      };

      const candidate = json.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || '';
      const tokensUsed = json.usageMetadata?.totalTokenCount;

      return {
        text,
        tokensUsed,
        latencyMs,
        model: this.model,
        provider: this.id,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AITimeoutError(`Google Gemini request timed out after ${timeoutMs}ms.`);
      }
      if (err instanceof Error && 'code' in err && (err as { code: string }).code?.startsWith('AI_')) {
        throw err;
      }
      throw new AIProviderError(
        `Gemini provider error: ${err instanceof Error ? err.message : String(err)}`
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
      throw new AIConfigurationError('Google Gemini is not configured. Please supply AI_API_KEY in server environment.');
    }

    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];
      if (options?.systemInstruction) {
        contents.push({ role: 'user', parts: [{ text: `[SYSTEM INSTRUCTION]\n${options.systemInstruction}` }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. I will strictly follow this instruction and return valid JSON.' }] });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: options?.temperature ?? 0.1,
            maxOutputTokens: options?.maxOutputTokens || this.defaultMaxTokens,
          },
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new AIRateLimitError('Google Gemini rate limit exceeded.');
        }
        throw new AIProviderError(`Google Gemini structured request failed (${response.status}): ${errorText}`);
      }

      const json = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { totalTokenCount?: number };
      };

      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const tokensUsed = json.usageMetadata?.totalTokenCount;

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseErr) {
        throw new AIOutputValidationError(`Malformed JSON from Gemini model: ${String(parseErr)}`, { rawText });
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
        throw new AITimeoutError(`Google Gemini structured request timed out after ${timeoutMs}ms.`);
      }
      if (err instanceof Error && 'code' in err && (err as { code: string }).code?.startsWith('AI_')) {
        throw err;
      }
      throw new AIProviderError(
        `Gemini provider error: ${err instanceof Error ? err.message : String(err)}`
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
