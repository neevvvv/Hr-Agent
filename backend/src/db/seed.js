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
  // Seed default profile rows so every employee has SOMETHING to view
  const defaultProfiles = [
    { eid: 1, phone: '+91-9876500001', email: 'priya.hr@xyzcorp.com', address_line1: '12 MG Road', city: 'Bengaluru', state: 'KA', postal_code: '560001', emergency_contact_name: 'Anil Sharma', emergency_contact_phone: '+91-9876500099', emergency_contact_relation: 'Spouse', date_of_birth: '1985-04-12', blood_group: 'O+', job_title: 'HR Manager', department: 'Human Resources' },
    { eid: 2, phone: '+91-9876500002', email: 'rahul@xyzcorp.com', address_line1: '45 Indiranagar', city: 'Bengaluru', state: 'KA', postal_code: '560038', emergency_contact_name: 'Sunita Verma', emergency_contact_phone: '+91-9876500098', emergency_contact_relation: 'Mother', date_of_birth: '1995-08-22', blood_group: 'A+', job_title: 'Software Engineer', department: 'Engineering' },
    { eid: 3, phone: '+91-9876500003', email: 'anita@xyzcorp.com', address_line1: '78 Koramangala', city: 'Bengaluru', state: 'KA', postal_code: '560034', emergency_contact_name: 'Ravi Iyer', emergency_contact_phone: '+91-9876500097', emergency_contact_relation: 'Father', date_of_birth: '1993-11-05', blood_group: 'B+', job_title: 'Product Designer', department: 'Design' },
    { eid: 4, phone: '+91-9876500004', email: 'vikram@xyzcorp.com', address_line1: '23 HSR Layout', city: 'Bengaluru', state: 'KA', postal_code: '560102', emergency_contact_name: 'Pooja Singh', emergency_contact_phone: '+91-9876500096', emergency_contact_relation: 'Sister', date_of_birth: '1990-02-18', blood_group: 'AB+', job_title: 'Data Analyst', department: 'Analytics' },
    { eid: 5, phone: '+91-9876500005', email: 'meera@xyzcorp.com', address_line1: '56 Whitefield', city: 'Bengaluru', state: 'KA', postal_code: '560066', emergency_contact_name: 'Kiran Patel', emergency_contact_phone: '+91-9876500095', emergency_contact_relation: 'Spouse', date_of_birth: '1997-06-30', blood_group: 'O-', job_title: 'Software Engineer', department: 'Engineering' },
    { eid: 6, phone: '+91-9876500006', email: 'arjun@xyzcorp.com', address_line1: '34 Jayanagar', city: 'Bengaluru', state: 'KA', postal_code: '560011', emergency_contact_name: 'Neha Kapoor', emergency_contact_phone: '+91-9876500094', emergency_contact_relation: 'Spouse', date_of_birth: '1992-09-14', blood_group: 'A-', job_title: 'Marketing Specialist', department: 'Marketing' },
  ];

  for (const p of defaultProfiles) {
    await db.query(`
      INSERT INTO worker_profiles (
        employee_id, phone, email, address_line1, city, state, postal_code,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        date_of_birth, blood_group, job_title, department
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (employee_id) DO NOTHING
    `, [
      p.eid, p.phone, p.email, p.address_line1, p.city, p.state, p.postal_code,
      p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation,
      p.date_of_birth, p.blood_group, p.job_title, p.department,
    ]);
  }
  console.log(`✅ Profile data seeded for ${defaultProfiles.length} employees.`);
  console.log(`✅ Seed complete. ${people.length} users, ${employees.length * types.length} balances.`);
  console.log(`   Login: rahul@xyzcorp.com / ${demoPassword} (employee)`);
  console.log(`   Login: priya.hr@xyzcorp.com / ${demoPassword} (admin)`);
  await db.pool.end();
}

seed().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});