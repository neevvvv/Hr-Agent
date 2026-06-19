import { Router } from 'express';
import { z } from 'zod';
import { authJwt } from '../middleware/authJwt.js';
import { runAgent } from '../agent/runner.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

router.post('/chat', authJwt, async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  try {
    const out = await runAgent({
      message: parsed.data.message,
      history: parsed.data.history ?? [],
      user: req.user,
    });
    res.json(out);
  } catch (e) {
    console.error('Agent error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;