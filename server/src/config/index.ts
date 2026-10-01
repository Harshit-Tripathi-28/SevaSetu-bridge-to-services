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
}

const nodeEnv = (process.env.NODE_ENV as ServerConfig['nodeEnv']) || 'development';

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
}
