const request = require('supertest');
const testApp = require('./index.ts');

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
})

beforeEach(() => {
  // seed the test database with test data
  db.prepare(`INSERT INTO roots DEFAULT VALUES`).run();
  db.prepare(`
    INSERT INTO nodes (label, parent_id, root_id)
    VALUES
      ('root', NULL, 1),
      ('child1', 1, 1),
      ('child2', 1, 1),
      ('child3', 2, 1);
  `).run();
  // console.log("Test database seeded.");
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
    console.log(res.body)
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
})

describe("POST /api/tree", () => {
  // it("should return 201 Created", async() => {
  //   const newNode = {
  //     label: "test",
  //     parentId: 1
  //   }

  //   const res = await request(testApp).post("/api/tree").send(newNode)

  //   expect(res.status).toBe(201);
  // })
})