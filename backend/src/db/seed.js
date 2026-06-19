import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import db from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// --- Leave types (from HR Policy 2026) ---
const insertType = db.prepare(
  'INSERT OR IGNORE INTO leave_types (code,name,annual_quota) VALUES (?,?,?)'
);
insertType.run('ANNUAL', 'Annual Leave', 20);
insertType.run('SICK',   'Sick Leave',   10);
insertType.run('CASUAL', 'Casual Leave',  5);

// --- Demo users ---
const demoPassword = 'password123';
const hash = bcrypt.hashSync(demoPassword, 10);

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (email,password_hash,role) VALUES (?,?,?)'
);
const insertEmp = db.prepare(
  'INSERT OR IGNORE INTO employees (user_id,full_name,manager_id,joined_on) VALUES (?,?,?,?)'
);

const people = [
  { email: 'priya.hr@xyzcorp.com',   role: 'admin',    name: 'Priya Sharma (HR Admin)', manager: null, joined: '2023-01-15' },
  { email: 'rahul@xyzcorp.com',      role: 'employee', name: 'Rahul Verma',             manager: 1,    joined: '2024-03-10' },
  { email: 'anita@xyzcorp.com',      role: 'employee', name: 'Anita Iyer',              manager: 1,    joined: '2024-06-22' },
  { email: 'vikram@xyzcorp.com',     role: 'employee', name: 'Vikram Singh',            manager: 1,    joined: '2025-02-01' },
  { email: 'meera@xyzcorp.com',      role: 'employee', name: 'Meera Patel',             manager: 1,    joined: '2025-08-14' },
  { email: 'arjun@xyzcorp.com',      role: 'employee', name: 'Arjun Kapoor',            manager: 1,    joined: '2026-01-05' },
];

const insertMany = db.transaction((rows) => {
  for (const p of rows) {
    const info = insertUser.run(p.email, hash, p.role);
    const userId = info.lastInsertRowid || db.prepare('SELECT id FROM users WHERE email=?').get(p.email).id;
    insertEmp.run(userId, p.name, p.manager, p.joined);
  }
});
insertMany(people);

// --- Initialize 2026 leave balances for everyone ---
const year = 2026;
const employees = db.prepare('SELECT id FROM employees').all();
const types = db.prepare('SELECT id FROM leave_types').all();
const insertBal = db.prepare(
  'INSERT OR IGNORE INTO leave_balances (employee_id,leave_type_id,year,used_days) VALUES (?,?,?,0)'
);
for (const e of employees) {
  for (const t of types) insertBal.run(e.id, t.id, year);
}

console.log('✅ Seed complete.');
console.log(`   ${people.length} users (password for all: "${demoPassword}")`);
console.log(`   Leave balances initialized for ${employees.length} employees × ${types.length} types in ${year}.`);
console.log('\n👤 Login as:');
console.log('   priya.hr@xyzcorp.com   (HR admin)');
console.log('   rahul@xyzcorp.com      (employee)');