import { config } from '../config/index.js';

export class FinancialPolicyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinancialPolicyConfigurationError';
  }
}

export interface FinancialPolicyConfig {
  platformCommissionPercent?: number;
  cancellationFreeWindowHours?: number;
  cancellationLateFeePercent?: number;
}

export interface CancellationPolicy {
  freeCancellationWindowHours: number;
  lateCancellationFeePercent: number;
}

/**
 * Server-only Financial Policy Service.
 * Centralizes retrieval and validation of marketplace financial rules
 * (platform commission rates, cancellation timeframes, late fees).
 *
 * Ensures no unapproved hardcoded default values exist in application logic.
 * Designed to allow direct migration to database-backed policy models without service rewrites.
 */
export class FinancialPolicyService {
  private static overrideConfig: Partial<FinancialPolicyConfig> | null = null;

  /**
   * Allows test suites and dynamic policy providers to override policy values.
   * Pass null to restore environment-based configuration.
   */
  static setPolicyOverride(override: Partial<FinancialPolicyConfig> | null): void {
    this.overrideConfig = override;
  }

  /**
   * Resolves effective policy values combining environment configuration and runtime overrides.
   */
  static getEffectivePolicy(): FinancialPolicyConfig {
    return {
      platformCommissionPercent:
        this.overrideConfig?.platformCommissionPercent !== undefined
          ? this.overrideConfig.platformCommissionPercent
          : config.financialPolicy?.platformCommissionPercent,
      cancellationFreeWindowHours:
        this.overrideConfig?.cancellationFreeWindowHours !== undefined
          ? this.overrideConfig.cancellationFreeWindowHours
          : config.financialPolicy?.cancellationFreeWindowHours,
      cancellationLateFeePercent:
        this.overrideConfig?.cancellationLateFeePercent !== undefined
          ? this.overrideConfig.cancellationLateFeePercent
          : config.financialPolicy?.cancellationLateFeePercent,
    };
  }

  /**
   * Retrieves the configured platform commission percentage.
   * Throws FinancialPolicyConfigurationError if not explicitly configured or out of valid bounds (0-100).
   */
  static getPlatformCommissionPercent(): number {
    const policy = this.getEffectivePolicy();
    const percent = policy.platformCommissionPercent;

    if (percent === undefined || percent === null || isNaN(percent)) {
      throw new FinancialPolicyConfigurationError(
        'Platform commission rate is not configured. Earning recognition cannot proceed without an approved business rule.'
      );
    }

    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      throw new FinancialPolicyConfigurationError(
        `Invalid platform commission percentage: ${percent}. Must be an integer between 0 and 100.`
      );
    }

    return percent;
  }

  /**
   * Retrieves the configured cancellation & refund policy.
   * Throws FinancialPolicyConfigurationError if cancellation policy parameters are not explicitly configured.
   */
  static getCancellationPolicy(): CancellationPolicy {
    const policy = this.getEffectivePolicy();
    const freeHours = policy.cancellationFreeWindowHours;
    const lateFee = policy.cancellationLateFeePercent;

    if (freeHours === undefined || freeHours === null || isNaN(freeHours)) {
      throw new FinancialPolicyConfigurationError(
        'Cancellation policy error: CANCELLATION_FREE_WINDOW_HOURS is not configured. Refund calculation cannot proceed without approved policy.'
      );
    }

    if (freeHours < 0) {
      throw new FinancialPolicyConfigurationError(
        `Invalid CANCELLATION_FREE_WINDOW_HOURS: ${freeHours}. Window hours must be greater than or equal to 0.`
      );
    }

    if (lateFee === undefined || lateFee === null || isNaN(lateFee)) {
      throw new FinancialPolicyConfigurationError(
        'Cancellation policy error: CANCELLATION_LATE_FEE_PERCENT is not configured. Refund calculation cannot proceed without approved policy.'
      );
    }

    if (!Number.isInteger(lateFee) || lateFee < 0 || lateFee > 100) {
      throw new FinancialPolicyConfigurationError(
        `Invalid CANCELLATION_LATE_FEE_PERCENT: ${lateFee}. Late fee percent must be an integer between 0 and 100.`
      );
    }

    return {
      freeCancellationWindowHours: freeHours,
      lateCancellationFeePercent: lateFee,
    };
  }
}
