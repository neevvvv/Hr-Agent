import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db/connection.js';
import authRoutes from './routes/auth.js';
import leaveRoutes from './routes/leave.js';
import agentRoutes from './routes/agent.js';
import notificationRoutes from './routes/notifications.js';     // ← THIS
import { authJwt } from './middleware/authJwt.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM leave_types').get();
    res.json({ status: 'ok', leave_types_seeded: Number(row?.n ?? 0) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.use('/auth', authRoutes);
app.use('/leave', leaveRoutes);
app.use('/agent', agentRoutes);
app.use('/notifications', notificationRoutes);                   // ← AND THIS

app.get('/me', authJwt, (req, res) => {
  res.json({ user: req.user });
});

app.use((err, _req, res, _next) => {
  console.error('💥 Unhandled:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 backend on http://localhost:${PORT}`);
  console.log(`🌍 CORS allowed:`, allowedOrigins);
});