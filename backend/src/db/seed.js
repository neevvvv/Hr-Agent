import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import db from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

async function seed() {
  console.log('🌱 Connecting to database...');
  await db.query(schema);
  console.log('✅ Schema applied.');

  // Leave types
  for (const [code, name, quota] of [
    ['ANNUAL', 'Annual Leave', 20],
    ['SICK',   'Sick Leave',   10],
    ['CASUAL', 'Casual Leave',  5],
  ]) {
    await db.query(
      'INSERT INTO leave_types (code, name, annual_quota) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING',
      [code, name, quota]
    );
  }

  // Users + employees
  const demoPassword = 'password123';
  const hash = await bcrypt.hash(demoPassword, 10);

  const people = [
    { email: 'priya.hr@xyzcorp.com', role: 'admin',    name: 'Priya Sharma (HR Admin)', manager: null, joined: '2023-01-15' },
    { email: 'rahul@xyzcorp.com',    role: 'employee', name: 'Rahul Verma',             manager: 1,    joined: '2024-03-10' },
    { email: 'anita@xyzcorp.com',    role: 'employee', name: 'Anita Iyer',              manager: 1,    joined: '2024-06-22' },
    { email: 'vikram@xyzcorp.com',   role: 'employee', name: 'Vikram Singh',            manager: 1,    joined: '2025-02-01' },
    { email: 'meera@xyzcorp.com',    role: 'employee', name: 'Meera Patel',             manager: 1,    joined: '2025-08-14' },
    { email: 'arjun@xyzcorp.com',    role: 'employee', name: 'Arjun Kapoor',            manager: 1,    joined: '2026-01-05' },
  ];

  for (const p of people) {
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
      [p.email, hash, p.role]
    );
    const userId = userResult.rows[0].id;
    await db.query(
      `INSERT INTO employees (user_id, full_name, manager_id, joined_on)
       VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO NOTHING`,
      [userId, p.name, p.manager, p.joined]
    );
  }

  // Initialize 2026 balances
  const year = 2026;
  const employees = (await db.query('SELECT id FROM employees')).rows;
  const types = (await db.query('SELECT id FROM leave_types')).rows;
  for (const e of employees) {
    for (const t of types) {
      await db.query(
        `INSERT INTO leave_balances (employee_id, leave_type_id, year, used_days)
         VALUES ($1, $2, $3, 0) ON CONFLICT DO NOTHING`,
        [e.id, t.id, year]
      );
    }
  }

  console.log(`✅ Seed complete. ${people.length} users, ${employees.length * types.length} balances.`);
  console.log(`   Login: rahul@xyzcorp.com / ${demoPassword} (employee)`);
  console.log(`   Login: priya.hr@xyzcorp.com / ${demoPassword} (admin)`);
  await db.pool.end();
}

seed().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});