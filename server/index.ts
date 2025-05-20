import express from "express";
import db from "./repository/sqliteRepository";
import { Root, Node } from "./interfaces/interfaces"

const app = express();

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/tree", (req, res) => {

  // initialize an array to hold all trees
  // select * from roots;
  // for each root returned, select * from nodes where root_id = root.id
  // construct tree, add it to the array, repeat with next
  // return array

  const roots = db.prepare(`
    SELECT * FROM roots;
    `).all();

  console.log(roots);

  const nodes = db.prepare(`SELECT * FROM nodes`).all();
  console.log(nodes);

  const tree = {
    "id": 1,
    "label": "root",
    "children": [
      {
        "id": 3,
        "label": "bear",
        "children": [
          {
            "id": 4,
            "label": "cat",
            "children": []
          }
        ]
      },
      {
        "id": 7,
        "label": "frog",
        "children": []
      }
    ]
  }
  res.json({ "Hello": "world" });
})

app.post("/api/tree", (req, res) => {
  const newNode = req.body;

  // validate the node with zod - needs to have a label and a parent id
  // if no parent id is provided, it is a root node and requires inserting a new record in the root tree
  // insert the node into the database
  // should it return the new whole tree? or just the node? or just status?


  res.status(201).json(newNode);
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/api/tree to see the tree data`);
})