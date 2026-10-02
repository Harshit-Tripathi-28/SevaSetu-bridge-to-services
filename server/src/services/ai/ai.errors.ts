import type { AiErrorCode } from '@sevasetu/shared';

export class AIServiceError extends Error {
  public readonly code: AiErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: AiErrorCode, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AIConfigurationError extends AIServiceError {
  constructor(message = 'AI provider is not configured. Please supply a valid AI_API_KEY in server environment.') {
    super(message, 'AI_CONFIG_MISSING', 503);
    this.name = 'AIConfigurationError';
  }
}

export class AITimeoutError extends AIServiceError {
  constructor(message = 'AI provider request timed out. Please try again later or use the standard form.') {
    super(message, 'AI_TIMEOUT', 504);
    this.name = 'AITimeoutError';
  }
}

export class AIRateLimitError extends AIServiceError {
  constructor(message = 'AI provider rate limit exceeded. Please wait a moment before trying again.') {
    super(message, 'AI_RATE_LIMITED', 429);
    this.name = 'AIRateLimitError';
  }
}

export class AIProviderError extends AIServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 'AI_PROVIDER_ERROR', 502, details);
    this.name = 'AIProviderError';
  }
}

export class AIOutputValidationError extends AIServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 'AI_OUTPUT_VALIDATION_FAILED', 502, details);
    this.name = 'AIOutputValidationError';
  }
}

export class AIUnsupportedServiceError extends AIServiceError {
  constructor(message = 'The requested service was not recognized in the platform catalog.') {
    super(message, 'AI_UNSUPPORTED_SERVICE', 400);
    this.name = 'AIUnsupportedServiceError';
  }
}

export class AIContextForbiddenError extends AIServiceError {
  constructor(message = 'Access to the requested context is forbidden.') {
    super(message, 'AI_CONTEXT_FORBIDDEN', 403);
    this.name = 'AIContextForbiddenError';
  }
}

export class AIInsufficientDataError extends AIServiceError {
  constructor(message = 'Insufficient historical data to generate reliable AI analysis.') {
    super(message, 'AI_INSUFFICIENT_DATA', 200);
    this.name = 'AIInsufficientDataError';
  }
}
