import Database from 'better-sqlite3';
import path from 'path';


const DB_PATH = path.resolve(__dirname, '../../data/database.sqlite')

const db = new Database(DB_PATH);

export default db;