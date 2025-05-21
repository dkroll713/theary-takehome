import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../../data/database.sqlite')
const isTestEnv = process.env.NODE_ENV === 'test';
const db = new Database(isTestEnv ? ':memory:' : DB_PATH);
db.pragma('foreign_keys = ON');

export default db;