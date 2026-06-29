import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import db from './db/connection.js';

import authRoutes from './routes/auth.js';
import leaveRoutes from './routes/leave.js';
import agentRoutes from './routes/agent.js';
import notificationRoutes from './routes/notifications.js';
import profileRoutes from './routes/profile.js';
import documentRoutes from './routes/documents.js';
import ticketRoutes from './routes/tickets.js';
import planRoutes from './routes/plan.js';
import memoryRoutes from './routes/memories.js';

import { authJwt } from './middleware/authJwt.js';
import {
  loginLimit,
  agentLimit,
  mutationLimit,
} from './middleware/rateLimits.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.set('trust proxy', 1);

// =====================================
// Health check (used by frontend pre-warm)
// =====================================
app.get('/health', async (_req, res) => {
  try {
    const row = await db
      .prepare('SELECT COUNT(*) AS n FROM leave_types')
      .get();

    res.json({
      status: 'ok',
      leave_types_seeded: Number(row?.n ?? 0),
    });
  } catch (e) {
    res.status(500).json({
      status: 'error',
      message: e.message,
    });
  }
});

// =====================================
// Rate limits — must come BEFORE routes
// =====================================
app.use('/auth/login', loginLimit);
app.use('/agent/chat', agentLimit);
app.use('/plan/stream', agentLimit);

app.use('/leave', mutationLimit);
app.use('/documents', mutationLimit);
app.use('/tickets', mutationLimit);
app.use('/profile', mutationLimit);
app.use('/memories', mutationLimit);

// =====================================
// Routes
// =====================================
app.use('/auth', authRoutes);
app.use('/leave', leaveRoutes);
app.use('/agent', agentRoutes);
app.use('/notifications', notificationRoutes);
app.use('/profile', profileRoutes);
app.use('/documents', documentRoutes);
app.use('/tickets', ticketRoutes);
app.use('/plan', planRoutes);
app.use('/memories', memoryRoutes);

// =====================================
// Auth check
// =====================================
app.get('/me', authJwt, (req, res) => {
  res.json({ user: req.user });
});

// =====================================
// Global error handler
// =====================================
app.use((err, _req, res, _next) => {
  console.error('💥 Unhandled:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// =====================================
// Start server
// =====================================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 backend on http://localhost:${PORT}`);
  console.log('🌍 CORS allowed:', allowedOrigins);
});