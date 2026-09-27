import type {
  AuthUser,
  RegisterRequest,
  LoginRequest,
  UserRole,
} from '@sevasetu/shared';
import { getPrismaClient } from '../config/database.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { signAuthToken } from '../utils/jwt.js';

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function getPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AuthError('Database service is unavailable. Please check system configuration.', 503);
  }
  return prisma;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
  /**
   * Registers a new user with real PostgreSQL persistence and password hashing.
   */
  static async register(data: RegisterRequest): Promise<{ user: AuthUser; token: string }> {
    const prisma = getPrisma();

    // 1. Validate required fields
    if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
      throw new AuthError('Email address is required.', 400);
    }
    if (!data.password || typeof data.password !== 'string') {
      throw new AuthError('Password is required.', 400);
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    // 2. Validate email format
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new AuthError('Please enter a valid email address format.', 400);
    }

    // 3. Validate password complexity
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      throw new AuthError(passwordValidation.message || 'Password does not meet security requirements.', 400);
    }

    // 4. Validate Role (strictly prohibit self-registration as ADMIN)
    let assignedRole: UserRole = 'CUSTOMER';
    if (data.role) {
      const requestedRole = data.role.toUpperCase();
      if (requestedRole === 'ADMIN') {
        throw new AuthError('Admin accounts cannot be registered publicly.', 403);
      }
      if (requestedRole === 'PROVIDER' || requestedRole === 'CUSTOMER') {
        assignedRole = requestedRole as UserRole;
      } else {
        throw new AuthError('Invalid account role specified. Allowed roles: CUSTOMER, PROVIDER.', 400);
      }
    }

    // 5. Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new AuthError('An account with this email address already exists.', 409);
    }

    // 6. Check duplicate phone if provided
    const normalizedPhone = data.phone?.trim() || null;
    if (normalizedPhone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
      if (existingPhone) {
        throw new AuthError('An account with this phone number already exists.', 409);
      }
    }

    // 7. Securely hash password
    const passwordHash = await hashPassword(data.password);

    // 8. Persist new user record to PostgreSQL
    const createdUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        phone: normalizedPhone,
        fullName: data.fullName?.trim() || null,
        passwordHash,
        role: assignedRole,
        status: 'ACTIVE',
      },
    });

    const safeUser: AuthUser = {
      id: createdUser.id,
      email: createdUser.email,
      fullName: createdUser.fullName,
      phone: createdUser.phone,
      role: createdUser.role as UserRole,
      status: createdUser.status,
      createdAt: createdUser.createdAt.toISOString(),
      updatedAt: createdUser.updatedAt.toISOString(),
    };

    const token = signAuthToken({
      userId: safeUser.id,
      role: safeUser.role,
    });

    return { user: safeUser, token };
  }

  /**
   * Authenticates a user with credential verification and account status enforcement.
   */
  static async login(data: LoginRequest): Promise<{ user: AuthUser; token: string }> {
    const prisma = getPrisma();

    if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
      throw new AuthError('Email address is required.', 400);
    }
    if (!data.password || typeof data.password !== 'string') {
      throw new AuthError('Password is required.', 400);
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    // Find user record in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Uniform 401 response prevents account enumeration
    if (!user) {
      throw new AuthError('Invalid email or password.', 401);
    }

    // Verify password hash
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password.', 401);
    }

    // Account status enforcement
    if (user.status === 'SUSPENDED') {
      throw new AuthError('Account is suspended. Please contact platform operations.', 403);
    }
    if (user.status === 'INACTIVE') {
      throw new AuthError('Account is inactive. Please contact support to reactivate.', 403);
    }

    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const token = signAuthToken({
      userId: safeUser.id,
      role: safeUser.role,
    });

    return { user: safeUser, token };
  }

  /**
   * Fetches safe user profile by ID and validates active status.
   */
  static async getUserById(userId: string): Promise<AuthUser | null> {
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Suspended or inactive users cannot establish sessions
    if (user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
