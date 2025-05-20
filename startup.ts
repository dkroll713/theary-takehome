import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '/data/database.sqlite');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

const clearSqliteDb = () => {
  db.prepare(`DELETE FROM roots`).run();
  db.prepare(`DELETE FROM nodes`).run();
}

const rootTableSql = `
  CREATE TABLE IF NOT EXISTS roots (
    id INTEGER PRIMARY KEY
  );
`

const nodeTableSql = `
  CREATE TABLE IF NOT EXISTS nodes (
   id INTEGER PRIMARY KEY,
   label TEXT NOT NULL,
   parent_id INTEGER,
   FOREIGN KEY (root_id) REFERENCES roots(id)
  );
`

const seedSqliteDb = () => {
  try {
    const insertRoot = db.prepare(`INSERT INTO roots DEFAULT VALUES`);
    insertRoot.run();
    console.log('Seeded root entry.');
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      console.log('Root already seeded.');
    } else {
      throw err;
    }
  }

  interface Root {
    id: number;
  }

  interface Node {
    id: number;
    label: string;
    parent_id: number | null;
    root_id: number;
  }

  type NodeId = number;
  interface NodeRow {
    id: NodeId;
  }

  const rows: Root[] = db.prepare(`SELECT * FROM roots`).all() as Root[];
  console.log(rows);
  const rootId = rows[0]?.id;

  const insertRootNode = db.prepare(`INSERT INTO nodes (label, root_id) values ('root',?)`)
  insertRootNode.run(rootId)
  const rootNodeRow: NodeRow[] = db.prepare(`SELECT id FROM nodes WHERE LABEL='root'`).all() as NodeRow[];
  const rootNodeId = rootNodeRow[0]?.id;

  const insertBearNode = db.prepare(`INSERT INTO nodes (label, parent_id, root_id) values ('bear',?,?)`)
  insertBearNode.run(rootNodeId, rootId)
  const bearNodeRow: NodeRow[] = db.prepare(`SELECT id FROM nodes WHERE label='bear'`).all() as NodeRow[]
  const bearNodeId = bearNodeRow[0]?.id;

  const insertCatNode = db.prepare(`INSERT INTO nodes (label, parent_id, root_id) values ('cat', ?, ?)`)
  insertCatNode.run(bearNodeId, rootId)

  const insertFrogNode = db.prepare(`INSERT INTO nodes (label, parent_id, root_id) values ('frog', ?, ?)`)
  insertFrogNode.run(rootNodeId, rootId)


  // second tree to test multiple roots
  const insertSecondRoot = db.prepare(`INSERT INTO roots DEFAULT VALUES`);
  insertSecondRoot.run();
  const insertSecondRootNode = db.prepare(`INSERT INTO nodes (label, root_id) values ('second_root', ?)`)
  insertSecondRootNode.run(2)


  const allNodes = db.prepare(`SELECT * FROM nodes`).all();
  console.log(allNodes);
};

const initializeSqliteDB = () => {
  db.prepare(rootTableSql).run();
  db.prepare(nodeTableSql).run();
}

clearSqliteDb();
initializeSqliteDB();
seedSqliteDb();

console.log('Database and tables created.');