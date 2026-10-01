import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { config } from './config/index.js';
import { verifyAuthToken } from './utils/jwt.js';
import { AuthService } from './services/auth.service.js';
import { getPrismaClient } from './config/database.js';
import type { AuthUser } from '@sevasetu/shared';

let ioInstance: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: AuthUser;
    userId?: string;
  };
}

/**
 * Initializes Socket.IO server with JWT authentication and authorization.
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.IO Handshake Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      let token: string | undefined;

      // 1. Check cookies from handshake headers
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const cookies = parseCookieHeader(cookieHeader);
        token = cookies[config.cookieName];
      }

      // 2. Check auth object in handshake (used by socket.io-client)
      if (!token && socket.handshake.auth && typeof socket.handshake.auth.token === 'string') {
        token = socket.handshake.auth.token;
      }

      // 3. Check authorization header
      if (!token && socket.handshake.headers.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] && /^Bearer$/i.test(parts[0]) && parts[1]) {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('AUTHENTICATION_REQUIRED'));
      }

      const payload = verifyAuthToken(token);
      if (!payload || !payload.userId) {
        return next(new Error('INVALID_TOKEN'));
      }

      const user = await AuthService.getUserById(payload.userId);
      if (!user || user.status !== 'ACTIVE') {
        return next(new Error('USER_NOT_FOUND_OR_INACTIVE'));
      }

      socket.data.user = user;
      socket.data.userId = user.id;

      return next();
    } catch {
      return next(new Error('AUTHENTICATION_FAILED'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.data.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // Join personal user room for direct in-app notifications
    socket.join(`user:${userId}`);

    // Join conversation room with server-side participant authorization
    socket.on('join_conversation', async (data: { conversationId: string }, callback?: (res: { success: boolean; error?: string }) => void) => {
      try {
        const { conversationId } = data || {};
        if (!conversationId) {
          if (callback) callback({ success: false, error: 'conversationId is required' });
          return;
        }

        const isAuthorized = await verifyConversationParticipant(conversationId, userId, socket.data.user?.role);
        if (!isAuthorized) {
          if (callback) callback({ success: false, error: 'Unauthorized to join conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        if (callback) callback({ success: true });
      } catch (_err) {
        if (callback) callback({ success: false, error: 'Internal error joining conversation' });
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (data: { conversationId: string }) => {
      if (data?.conversationId) {
        socket.leave(`conversation:${data.conversationId}`);
      }
    });

    socket.on('disconnect', () => {
      // Socket automatically leaves rooms upon disconnection
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Server-side authorization check to ensure user is customer, provider, or admin of conversation.
 */
async function verifyConversationParticipant(
  conversationId: string,
  userId: string,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'ADMIN') return true;

  const prisma = getPrismaClient();
  if (!prisma) return false;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      providerProfile: { select: { userId: true } },
    },
  });

  if (!conversation) return false;

  const isCustomer = conversation.customerId === userId;
  const isProvider = conversation.providerProfile.userId === userId;

  return isCustomer || isProvider;
}

function parseCookieHeader(header: string): Record<string, string> {
  const list: Record<string, string> = {};
  header.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const key = parts[0]?.trim();
    const val = parts.slice(1).join('=').trim();
    if (key) {
      list[key] = decodeURIComponent(val);
    }
  });
  return list;
}
