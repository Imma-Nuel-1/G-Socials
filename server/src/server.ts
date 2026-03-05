// ============================================
// SERVER — Production entry point
// Multi-platform SaaS with workers
// ============================================

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import app from './app.js';

// Import workers
import { startAllWorkers } from './workers/index.js';

// Import cleanup
import { closeRedis } from './lib/redis.js';

const PORT = process.env.PORT || 3001;

// ============================================
// START SERVER + WORKERS
// ============================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🚀 Social Hub API — Multi-Platform SaaS       ║
║  Port: ${String(PORT).padEnd(41)}║
║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(41)}║
╚════════════════════════════════════════════════╝
  `);

  // Start BullMQ workers after server is listening
  startAllWorkers();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  server.close();
  await closeRedis();
  process.exit(0);
});

export default app;
