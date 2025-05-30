import express from "express";
import {
  getTree,
  createTree,
  cloneNodeAndChildren,
} from "../controllers/treeController.js";

const router = express.Router();

router.get("/tree", getTree);
router.post("/tree", createTree);
router.post("/clone", cloneNodeAndChildren);

export default router;