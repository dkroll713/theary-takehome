import express from "express";
import db from "./repository/sqliteRepository.js";
import { Root, Node } from "./interfaces/interfaces.js"
import createTreeNodeSchema from "./schemas/CreateTreeNodeSchema.js";

const app = express();

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/tree", (req, res) => {
  const trees = [];
  const roots = db.prepare(`
    SELECT * FROM roots;
    `).all() as Root[];

  for (const root of roots) {
    const nodes = db.prepare(`
      SELECT * FROM nodes WHERE root_id = ?;
    `).all(root.id) as Node[];

    // construct tree using parent_id to determine the hierarchy
    const rootNode = nodes.find((node: Node) => node.parent_id === null);

    const tree: { id: number | undefined; label: string | undefined; children: { id: number; label: string; children: any[] }[] } = {
      id: rootNode?.id,
      label: rootNode?.label,
      children: []
    }
    nodes.shift();

    while (nodes.length > 0) {
      const node = nodes.shift();
      // if the node's parent id is the same as the tree's id, add it to the tree
      if (node && node.parent_id === tree.id) {
        tree.children.push({
          id: node.id,
          label: node.label,
          children: []
        });
      } else {
        // otherwise check if the current node's parent is a child ANYWHERE in the tree
        // our insertion logic prevents nodes from being queried if they do not belong somewhere in the current tree
        const insertIntoTree = (currentNode: any): boolean => {
          if (node && currentNode.id === node.parent_id) {
            currentNode.children.push({
              id: node.id,
              label: node.label,
              children: []
            });
            return true; // stop once inserted
          }

          // Recurse through all children
          for (const child of currentNode.children) {
            if (insertIntoTree(child)) {
              return true;
            }
          }

          return false; // not found in this branch
        };

        insertIntoTree(tree);
      }
    }
    trees.push(tree);
  }
  // console.log(trees);
  res.send(trees);
})

app.post("/api/tree", (req: any, res: any) => {
  // validate the node with zod - needs to have a label and a parent id
  const newNode = createTreeNodeSchema.parse(req.body);

  // check if the parent id exists in the database
  const parentId = newNode.parentId;
  if (parentId === 0 && newNode.label === "root") {
    // if the parent id is 0 and label is 'root', it is a root node and requires inserting a new record in the root tree
    const insertRoot = db.prepare(`
      INSERT INTO roots DEFAULT VALUES;
    `);
    insertRoot.run();

    const rootId = db.prepare(`
      SELECT id FROM roots ORDER BY id DESC LIMIT 1;
    `).get() as Root | undefined;

    const insertRootNode = db.prepare(`
      INSERT INTO nodes (label, root_id) VALUES (?, ?);
    `);
    insertRootNode.run(newNode.label, rootId?.id);

    const newNodeRecord = db.prepare(`
      SELECT * FROM nodes WHERE label = ? AND parent_id = ?;
    `).get(newNode.label, parentId) as Node | undefined;
    if (!newNodeRecord) {
      return res.status(400).json({ error: "Node not created" });
    }
    console.log(`New root node created:`, newNodeRecord);
    res.status(201).json(newNodeRecord);
  } else {

    const parentNode = db.prepare(`
    SELECT * FROM nodes WHERE id = ?;
  `).get(parentId) as Node | undefined;
    if (!parentNode) {
      return res.status(400).json({ error: "Parent node not found" });
    }

    // if there is a parent node, insert this node into the database
    const insertNode = db.prepare(`
    INSERT INTO nodes (label, parent_id, root_id) VALUES (?, ?, ?);
  `);
    const rootId = parentNode.root_id;
    const label = newNode.label;
    insertNode.run(label, parentId, rootId);
  }

  // retrieve the newly created node from the database
  const newNodeRecord = db.prepare(`
    SELECT * FROM nodes WHERE label = ? AND parent_id = ?;
  `).get(newNode.label, parentId) as Node | undefined;
  if (!newNodeRecord) {
    return res.status(400).json({ error: "Node not created" });
  }


  res.status(201).json(newNodeRecord);
})

export default app;