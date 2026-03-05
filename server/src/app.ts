// ============================================
// APP — Express application setup
// Separated from server.ts so tests can import
// the app without starting the HTTP listener.
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import templateRoutes from './routes/templates.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import teamRoutes from './routes/team.js';
import uploadRoutes from './routes/upload.js';
import settingsRoutes from './routes/settings.js';
import workspaceRoutes from './routes/workspaces.js';
import socialAccountRoutes from './routes/socialAccounts.js';
import webhookRoutes from './routes/webhooks.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimit.js';

const app = express();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://g-socials.vercel.app',
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Request logging — silence during tests
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing (for refresh tokens)
app.use(cookieParser());

// Rate limiting
app.use('/api', generalLimiter);

// Static file serving (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================
// ROUTES
// ============================================

// Health check (unauthenticated)
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
    error: null,
  });
});

// Auth (no workspace context needed)
app.use('/api/auth', authRoutes);

// Workspace management
app.use('/api/workspaces', workspaceRoutes);

// Workspace-scoped resources (require x-workspace-id header)
app.use('/api/posts', postRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/social-accounts', socialAccountRoutes);

// Non-workspace-scoped
app.use('/api/ai', aiRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/upload', uploadRoutes);

// Webhooks (unauthenticated — verified by platform signatures)
app.use('/webhooks', webhookRoutes);

// ============================================
// ERROR HANDLING (must be last)
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
