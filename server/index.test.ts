import request from 'supertest';
// const testApp = require('./index.js');
import testApp from './index';

// const db = require("./repository/sqliteRepository");
import db from "./repository/sqliteRepository";

beforeAll(() => {
  db.prepare(`DROP TABLE IF EXISTS nodes`).run();
  db.prepare(`DROP TABLE IF EXISTS roots`).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS roots (
      id INTEGER PRIMARY KEY
    );
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      parent_id INTEGER,
      root_id INTEGER,
      FOREIGN KEY (root_id) REFERENCES roots(id)
    );
  `).run();
  db.prepare(`INSERT INTO roots DEFAULT VALUES`).run();
  db.prepare(`INSERT INTO roots DEFAULT VALUES`).run();
  db.prepare(`
    INSERT INTO nodes (label, parent_id, root_id)
    VALUES
      ('root', NULL, 1),
      ('child1', 1, 1),
      ('child2', 1, 1),
      ('child3', 2, 1),
      ('child4', 2, 1);
  `).run();
  db.prepare(`
    INSERT INTO nodes (label, parent_id, root_id)
    VALUES
      ('root', NULL, 2),
      ('child1', 6, 2),
      ('child2', 6, 2),
      ('child3', 7, 2),
      ('child4', 8, 2),
      ('child5', 8, 2),
      ('child6', 9, 2);
  `).run();
})

describe("GET /api/tree", () => {
  it("should return 200 OK", async () => {
    const res = await request(testApp).get("/api/tree")

    expect(res.status).toBe(200);
  })

  it("should return an array", async () => {
    const res = await request(testApp).get("/api/tree")

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  })

  it("each item in the array should be a tree", async () => {
    const res = await request(testApp).get("/api/tree")

    for (const tree of res.body) {
      expect(tree).toHaveProperty("id");
      expect(tree).toHaveProperty("label");
      expect(tree).toHaveProperty("children");
      expect(tree.children).toBeInstanceOf(Array);
    }
  })

  it("if a tree has children, those children are also nodes", async () => {
    const res = await request(testApp).get("/api/tree")

    for (const tree of res.body) {
      if (tree.children.length > 0) {
        for (const child of tree.children) {
          expect(child).toHaveProperty("id");
          expect(child).toHaveProperty("label");
        }
      }
    }
  })
})

describe("POST /api/tree", () => {
  it("should return 201 Created with a valid input", async () => {
    const newNode = {
      label: "test",
      parentId: 1
    }

    const res = await request(testApp).post("/api/tree").send(newNode)

    expect(res.status).toBe(201);
  })

  it("should return 400 Bad Request if parentId is not found", async () => {
    const newNode = {
      label: "test",
      parentId: 9999
    }

    const res = await request(testApp).post("/api/tree").send(newNode)

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Parent node not found");
  })

  it("should return the created node", async () => {
    const newNode = {
      label: "test",
      parentId: 1
    }

    const res = await request(testApp).post("/api/tree").send(newNode)


    expect(res.body).toHaveProperty("label", newNode.label);
    expect(res.body).toHaveProperty("parent_id", newNode.parentId);
    expect(res.body).toHaveProperty("id");
  })

  it("should reflect the new node in the database", async () => {
    const newNode = {
      label: "test",
      parentId: 1
    }

    await request(testApp).post("/api/tree").send(newNode)

    const node = db.prepare(`SELECT * FROM nodes WHERE label = ?`).get(newNode.label);

    expect(node).toHaveProperty("label", newNode.label);
    expect(node).toHaveProperty("parent_id", newNode.parentId);
    expect(node).toHaveProperty("root_id");
    expect(node).toHaveProperty("id");
  })

  it("should create a new root node if parentId is 0 and label contains 'root'", async () => {
    const newNode = {
      label: "root",
      parentId: 0
    }

    const res = await request(testApp).post("/api/tree").send(newNode)

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("label", newNode.label);
    expect(res.body).toHaveProperty("parent_id", null);
    expect(res.body).toHaveProperty("id");
  })

})

afterAll(async () => {
  // delete the in memory database
  db.prepare(`DROP TABLE IF EXISTS nodes`).run();
  db.prepare(`DROP TABLE IF EXISTS roots`).run();
  // close the database connection
  await db.close();
})