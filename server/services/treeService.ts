import db from "../repository/sqliteRepository.js";
import { Node, Root } from "../interfaces/interfaces.js";

export function getTreeStructure() {
  const trees = [];
  const roots = db.prepare(`
    SELECT * FROM roots;
    `).all() as Root[];

  for (const root of roots) {
    const nodes = db.prepare(`
        SELECT * FROM nodes WHERE root_id = ?;
      `).all(root.id) as Node[];
    const rootNode = nodes.find((node: Node) => node.parent_id === null);
    const tree: { id: number | undefined; label: string | undefined; children: { id: number; label: string; children: any[] }[] } = {
      id: rootNode?.id,
      label: rootNode?.label,
      children: []
    }

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
  return trees;
}

export function insertNode(newNode: { label: string, parentId: number }) {
  const parentId = newNode.parentId;
  if (parentId === 0 && newNode.label.includes("root")) {
    db.prepare(`
      INSERT INTO roots DEFAULT VALUES;
    `).run();
    const rootId = db.prepare(`
      SELECT id FROM roots ORDER BY id DESC LIMIT 1;
    `).get() as Root | undefined;
    db.prepare(`
      INSERT INTO nodes (label, root_id) VALUES (?, ?);
    `).run(newNode.label, rootId?.id);
  } else {
    const parentNode = db.prepare(`
      SELECT * FROM nodes WHERE id = ?;
    `).get(parentId) as Node | undefined;
    if (!parentNode) {
      return null;
    }
    db.prepare(`
      INSERT INTO nodes (label, parent_id, root_id) VALUES (?, ?, ?);
    `).run(newNode.label, parentId, parentNode.root_id);
  }

  return findNodeByLabelAndParent(newNode.label, parentId);
}

function findNodeByLabelAndParent(label: string, parentId: number) {
  if (parentId === 0 && label.includes("root")) {
    return db.prepare(`Select * from nodes where label = ? and parent_id is null`).get(label) as Node | undefined;
  } else {
    return db.prepare(`Select * from nodes where label = ? and parent_id = ?`).get(label, parentId) as Node | undefined;
  }
}

export function cloneNodeAndChildren(nodeId: number, destinationId: number) {
  // selects node to clone
  console.log(`Cloning node with ID: ${nodeId} to destination ID: ${destinationId}`);
  const nodeToClone = db.prepare(`
    SELECT * FROM nodes WHERE id = ?;
  `).get(nodeId) as Node | undefined;

  if (!nodeToClone) {
    throw new Error("Node not found");
  }

  // selects node to add cloned node to
  const destinationNode = db.prepare(`
    SELECT * FROM nodes WHERE id = ?;
  `).get(destinationId) as Node | undefined;

  if (!destinationNode) {
    throw new Error("Destination node not found");
  }

  // inserts the cloned node into the database
  const clonedNodeId = db.prepare(`
    INSERT INTO nodes (label, parent_id, root_id)
    VALUES (?, ?, ?);
  `).run(nodeToClone.label, destinationId, destinationNode.root_id).lastInsertRowid as number;

  // recursively clone children of the node
  let currentParentId = nodeId;

  const children = findChildren(nodeToClone);
  console.log(children)

  while (children.length > 0) {
    const child = children.shift();
    console.log('Current child:', child);
    if (child) {
      const insertNode = insertClonedNode(child, clonedNodeId);
    }
  }

  return findNodeByLabelAndParent(nodeToClone.label, destinationId);
}

const findChildren = (node: Node): Node[] => {
  const children = db.prepare(`
    SELECT * FROM nodes WHERE parent_id = ?;
  `).all(node.id) as Node[];

  return children.map(child => ({
    ...child,
    children: findChildren(child)
  }));
}

const insertClonedNode = (node: Node, parentId: number) => {
  console.log(`Inserting cloned node: ${node.label} with parent ID: ${parentId}`);
  const clonedNodeId = db.prepare(`
    INSERT INTO nodes (label, parent_id, root_id)
    VALUES (?, ?, ?);
  `).run(node.label, parentId, node.root_id).lastInsertRowid;


  return clonedNodeId;
}