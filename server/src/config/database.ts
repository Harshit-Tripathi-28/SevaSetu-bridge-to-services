import { PrismaClient } from '@prisma/client';
import type { DatabaseHealth } from '@sevasetu/shared';
import { config } from './index.js';

// Global declaration to maintain singleton across module reloads in development
declare global {
  var __sevasetu_prisma__: PrismaClient | undefined;
}

let prismaClientInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient | null {
  if (!config.databaseUrl || config.databaseUrl.trim() === '') {
    return null;
  }

  if (config.nodeEnv === 'production') {
    if (!prismaClientInstance) {
      prismaClientInstance = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return prismaClientInstance;
  }

  // Development / Test: reuse global instance
  if (!global.__sevasetu_prisma__) {
    global.__sevasetu_prisma__ = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  return global.__sevasetu_prisma__;
}

/**
 * Perform a genuine database connectivity check using a lightweight raw query.
 * Verifies if PostgreSQL is reachable and responsive.
 * Never fabricates a connected state.
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  if (!config.databaseUrl || config.databaseUrl.trim() === '') {
    return {
      connected: false,
      status: 'unconfigured',
      message: 'DATABASE_URL environment variable is missing or empty. PostgreSQL instance required.',
    };
  }

  const client = getPrismaClient();
  if (!client) {
    return {
      connected: false,
      status: 'unconfigured',
      message: 'Unable to initialize PrismaClient: DATABASE_URL is not properly configured.',
    };
  }

  try {
    // Send a real query to test the live PostgreSQL database connection
    await client.$queryRaw`SELECT 1`;
    return {
      connected: true,
      status: 'connected',
      message: 'PostgreSQL database connection verified and operational.',
    };
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : String(error);
    return {
      connected: false,
      status: 'error',
      message: `PostgreSQL connection check failed: ${errorDetails}`,
    };
  }
}
