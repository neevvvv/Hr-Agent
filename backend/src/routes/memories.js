import { Router } from 'express';
import { z } from 'zod';
import { authJwt } from '../middleware/authJwt.js';
import { saveMemory, listMemories, deleteMemory } from '../services/memoryStore.js';

const router = Router();

router.get('/', authJwt, async (req, res) => {
  const memories = await listMemories(req.user.uid);
  res.json({ memories });
});

router.post('/', authJwt, async (req, res) => {
  const parsed = z.object({ content: z.string().min(2).max(500) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const id = await saveMemory({
    userId: req.user.uid,
    content: parsed.data.content,
    source: 'explicit',
  });
  res.status(201).json({ id });
});

router.delete('/:id', authJwt, async (req, res) => {
  await deleteMemory(req.user.uid, Number(req.params.id));
  res.json({ ok: true });
});

export default router;