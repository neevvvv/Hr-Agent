import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import db from '../db/connection.js';

const router = Router();

const DEMO_EMAILS = new Set([
  'priya.hr@xyzcorp.com',
  'rahul@xyzcorp.com',
  'anita@xyzcorp.com',
  'vikram@xyzcorp.com',
  'meera@xyzcorp.com',
  'arjun@xyzcorp.com',
]);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await db
    .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
    .get(normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);

  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const emp = await db
    .prepare('SELECT id, full_name FROM employees WHERE user_id = ?')
    .get(user.id);

  const isDemo = DEMO_EMAILS.has(user.email.toLowerCase());

  const token = jwt.sign(
    {
      uid: user.id,
      role: user.role,
      eid: emp?.id,
      name: emp?.full_name,
      is_demo: isDemo,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: isDemo ? '2h' : '12h',
    }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: emp?.full_name,
      employee_id: emp?.id,
      is_demo: isDemo,
    },
  });
});

export default router;