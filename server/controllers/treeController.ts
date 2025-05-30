import { Request, Response } from 'express';
import createTreeNodeSchema from '../schemas/CreateTreeNodeSchema.js';
import * as treeService from '../services/treeService.js';

export const getTree = (req: Request, res: Response) => {
  const trees = treeService.getTreeStructure();
  res.json(trees);
}

export const createTree = (req: Request, res: Response): Promise<void> => {
  try {
    const validateData = createTreeNodeSchema.parse(req.body);
    const newNode = treeService.insertNode(validateData);
    if (!newNode) {
      res.status(400).json({ error: "Parent node not found" });
      return Promise.resolve();
    }
    res.status(201).json(newNode);
    return Promise.resolve();
  } catch (error: any) {
    res.status(400).json({ error: error.errors[0].message });
    return Promise.resolve();
  }
}

export const cloneNodeAndChildren = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId, destinationId } = req.body;
    if (!nodeId) {
      res.status(400).json({ error: "Node ID is required" });
      return;
    }
    const clonedNode = await treeService.cloneNodeAndChildren(nodeId, destinationId);
    res.status(201).json(clonedNode);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}