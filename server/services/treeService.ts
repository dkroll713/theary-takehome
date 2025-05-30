import db from "../repository/sqliteRepository.js";
import { Node, Root, NodeWithChildren } from "../interfaces/interfaces.js";

export function getTreeStructure() {
  const trees = [];

  // Get all nodes across all roots
  const allNodes = db.prepare(`SELECT * FROM nodes;`).all() as Node[];

  // Create a map of nodes by their ID
  const nodeMap = new Map<number, any>();
  for (const node of allNodes) {
    nodeMap.set(node.id, { ...node, children: [] });
  }

  // Attach children to parents
  for (const node of allNodes) {
    if (node.parent_id !== null) {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(nodeMap.get(node.id));
      }
    }
  }

  // Get all root nodes (parent_id === null)
  for (const node of allNodes) {
    if (node.parent_id === null) {
      trees.push(nodeMap.get(node.id));
    }
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
  let currentParentId = clonedNodeId;

  const children = findChildren(nodeToClone);
  console.log(`Children:`, children)

  while (children.length > 0) {
    const child = children.shift();
    if (child) {
      console.log(`Cloning child: ${child.label} with parent ID: ${currentParentId}`);
      const clonedChildId = insertClonedNode(child, currentParentId);
      console.log(`Cloned child inserted with ID: ${clonedChildId}`);
      // if the child has children, insert them recursively
      if (child.children && child.children.length > 0) {
        insertChildren(child.children, clonedChildId, destinationNode.root_id);
      }
      if (children.length === 0) currentParentId = clonedChildId;
    }
  }

  return findNodeByLabelAndParent(nodeToClone.label, destinationId);
}

const findChildren = (node: Node): NodeWithChildren[] => {
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
  `).run(node.label, parentId, node.root_id).lastInsertRowid as number;

  console.log(`Cloned node inserted with ID: ${clonedNodeId}`);


  return clonedNodeId;
}


const insertChildren = (children: NodeWithChildren[], parentId: number, rootId: number) => {
  for (const child of children) {
    // insert the child node
    const clonedChildId = db.prepare(`
      INSERT INTO nodes (label, parent_id, root_id)
      VALUES (?, ?, ?);
    `).run(child.label, parentId, rootId).lastInsertRowid as number;

    // if there are any, insert children of the child node
    if (child.children && child.children.length > 0) {
      insertChildren(child.children, clonedChildId, rootId);
    }
  }
}