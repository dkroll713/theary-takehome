import Database from 'better-sqlite3';
import path from 'path';

import { fileURLToPath } from 'url';

<<<<<<< HEAD
const DB_PATH = path.resolve(__dirname, '../../data/database.sqlite')
=======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../../../data/database.sqlite')
>>>>>>> 7308f6f3f5149903901a79070d87f4336d17a3eb
const isTestEnv = process.env.NODE_ENV === 'test';
const db = new Database(isTestEnv ? ':memory:' : DB_PATH);
db.pragma('foreign_keys = ON');

export default db;