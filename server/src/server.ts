import { createServer } from 'http';
import { createApp } from './app.js';
import { config, validateConfig } from './config/index.js';
import { getPrismaClient } from './config/database.js';
import { initSocketServer } from './socket.js';

// Validate configuration on boot
validateConfig();

const app = createApp();
const server = createServer(app);

// Attach Socket.IO
initSocketServer(server);

server.listen(config.port, () => {
  console.log(`[SevaSetu Server] HTTP & WebSocket server listening on http://localhost:${config.port}`);
});

async function handleShutdown(signal: string) {
  console.log(`[SevaSetu Server] Received ${signal}. Closing HTTP server...`);
  
  // Close Prisma connection if active
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('[SevaSetu Database] Prisma client disconnected.');
    } catch {
      // Ignore disconnect errors during process termination
    }
  }

  server.close(() => {
    console.log('[SevaSetu Server] HTTP server closed gracefully.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => void handleShutdown('SIGTERM'));
process.on('SIGINT', () => void handleShutdown('SIGINT'));
