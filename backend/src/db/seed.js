import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const insertType = db.prepare(
  'INSERT OR IGNORE INTO leave_types (code,name,annual_quota) VALUES (?,?,?)'
);
insertType.run('ANNUAL', 'Annual Leave', 20);
insertType.run('SICK',   'Sick Leave',   10);
insertType.run('CASUAL', 'Casual Leave',  5);

console.log('✅ Schema + leave types seeded.');
console.log('   Annual 20 / Sick 10 / Casual 5 (per HR Policy 2026).');