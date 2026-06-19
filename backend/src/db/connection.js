import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../../hr.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
export default db;