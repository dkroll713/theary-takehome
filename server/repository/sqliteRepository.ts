import Database from 'better-sqlite3';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../../../data/database.sqlite')
const isTestEnv = process.env.NODE_ENV === 'test';
const db = new Database(isTestEnv ? ':memory:' : DB_PATH);
db.pragma('foreign_keys = ON');

export default db;