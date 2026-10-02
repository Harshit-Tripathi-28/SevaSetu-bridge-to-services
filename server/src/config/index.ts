import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server root (.env) or workspace root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  clientUrl: string;
  databaseUrl: string;
  authSecret: string;
  cookieName: string;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    maxAge: number;
    path: string;
  };
  jwtExpiresIn: string;
  saltRounds: number;
  paymentGateway: {
    provider: string;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    razorpayWebhookSecret?: string;
  };
  financialPolicy: {
    platformCommissionPercent?: number;
    cancellationFreeWindowHours?: number;
    cancellationLateFeePercent?: number;
  };
  ai: {
    enabled: boolean;
    provider: 'GEMINI' | 'OPENAI' | 'CUSTOM';
    apiKey?: string;
    model: string;
    timeoutMs: number;
    maxOutputTokens: number;
  };
}

const nodeEnv = (process.env.NODE_ENV as ServerConfig['nodeEnv']) || 'development';

const aiProvider = ((process.env.AI_PROVIDER || 'GEMINI').toUpperCase() as 'GEMINI' | 'OPENAI' | 'CUSTOM');
const defaultAiModel = aiProvider === 'OPENAI' ? 'gpt-4o-mini' : 'gemini-1.5-flash';

export const config: ServerConfig = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  authSecret: process.env.AUTH_SECRET || 'sevasetu_jwt_dev_secret_key_2026_super_secure',
  cookieName: 'sevasetu_auth',
  cookieOptions: {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  },
  jwtExpiresIn: '7d',
  saltRounds: 10,
  paymentGateway: {
    provider: process.env.PAYMENT_GATEWAY_PROVIDER || 'RAZORPAY',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  financialPolicy: {
    platformCommissionPercent:
      process.env.PLATFORM_COMMISSION_PERCENT !== undefined &&
      process.env.PLATFORM_COMMISSION_PERCENT.trim() !== ''
        ? Number(process.env.PLATFORM_COMMISSION_PERCENT)
        : undefined,
    cancellationFreeWindowHours:
      process.env.CANCELLATION_FREE_WINDOW_HOURS !== undefined &&
      process.env.CANCELLATION_FREE_WINDOW_HOURS.trim() !== ''
        ? Number(process.env.CANCELLATION_FREE_WINDOW_HOURS)
        : undefined,
    cancellationLateFeePercent:
      process.env.CANCELLATION_LATE_FEE_PERCENT !== undefined &&
      process.env.CANCELLATION_LATE_FEE_PERCENT.trim() !== ''
        ? Number(process.env.CANCELLATION_LATE_FEE_PERCENT)
        : undefined,
  },
  ai: {
    enabled: process.env.AI_ENABLED !== 'false',
    provider: aiProvider,
    apiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || undefined,
    model: process.env.AI_MODEL || defaultAiModel,
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 15000,
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 2048,
  },
};

export function validateConfig(): void {
  console.log('[SevaSetu Config] Initializing server environment:');
  console.log(`  - Environment: ${config.nodeEnv}`);
  console.log(`  - Port: ${config.port}`);
  console.log(`  - Client URL (CORS): ${config.clientUrl}`);

  if (!config.databaseUrl || config.databaseUrl.trim() === '') {
    console.warn(
      '  - Database (PostgreSQL): [UNCONFIGURED] DATABASE_URL is not set. Real database connectivity will remain degraded until PostgreSQL is provisioned.'
    );
  } else {
    // Mask credentials before logging
    const maskedUrl = config.databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
    console.log(`  - Database (PostgreSQL): [CONFIGURED] Target: ${maskedUrl}`);
  }

  // Validate Financial Policies (Reject unapproved implicit rules)
  if (config.financialPolicy.platformCommissionPercent !== undefined) {
    const comm = config.financialPolicy.platformCommissionPercent;
    if (isNaN(comm) || !Number.isInteger(comm) || comm < 0 || comm > 100) {
      console.error(
        `  - Financial Policy: [ERROR] PLATFORM_COMMISSION_PERCENT must be an integer between 0 and 100 (got: ${comm}).`
      );
    } else {
      console.log(`  - Financial Policy: [CONFIGURED] Platform Commission: ${comm}%`);
    }
  } else {
    console.log(
      '  - Financial Policy: [UNCONFIGURED] PLATFORM_COMMISSION_PERCENT is not set. Earning recognition will reject safely.'
    );
  }

  if (
    config.financialPolicy.cancellationFreeWindowHours !== undefined &&
    config.financialPolicy.cancellationLateFeePercent !== undefined
  ) {
    const hours = config.financialPolicy.cancellationFreeWindowHours;
    const fee = config.financialPolicy.cancellationLateFeePercent;
    if (isNaN(hours) || hours < 0 || isNaN(fee) || !Number.isInteger(fee) || fee < 0 || fee > 100) {
      console.error(
        `  - Financial Policy: [ERROR] Invalid cancellation policy: Free window hours=${hours}, Late fee percent=${fee}`
      );
    } else {
      console.log(`  - Financial Policy: [CONFIGURED] Cancellation: Free window=${hours}h, Late fee=${fee}%`);
    }
  } else {
    console.log(
      '  - Financial Policy: [UNCONFIGURED] Cancellation policy is not set. Automated cancellation refunds will reject safely.'
    );
  }
}
