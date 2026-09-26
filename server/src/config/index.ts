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
}

export const config: ServerConfig = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: (process.env.NODE_ENV as ServerConfig['nodeEnv']) || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
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
