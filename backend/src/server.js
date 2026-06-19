import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db/connection.js';
import authRoutes from './routes/auth.js';
import leaveRoutes from './routes/leave.js';
import agentRoutes from './routes/agent.js';                  // ← NEW
import { authJwt } from './middleware/authJwt.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  const row = db.prepare('SELECT COUNT(*) AS n FROM leave_types').get();
  res.json({ status: 'ok', leave_types_seeded: row.n });
});

app.use('/auth', authRoutes);
app.use('/leave', leaveRoutes);
app.use('/agent', agentRoutes);                                // ← NEW

app.get('/me', authJwt, (req, res) => res.json({ user: req.user }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 backend on http://localhost:${PORT}`));