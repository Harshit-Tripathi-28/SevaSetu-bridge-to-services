import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface JwtTokenPayload {
  userId: string;
  role: string;
}

/**
 * Signs a JWT authentication token containing user ID and role.
 */
export function signAuthToken(payload: JwtTokenPayload): string {
  return jwt.sign(payload, config.authSecret, {
    expiresIn: '7d',
  });
}

/**
 * Verifies a JWT authentication token.
 * Returns decoded payload on success or null on failure.
 */
export function verifyAuthToken(token: string): JwtTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.authSecret) as JwtTokenPayload;
    if (decoded && decoded.userId && decoded.role) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}
