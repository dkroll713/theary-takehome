import express from "express";
import {
  getTree,
  createTree
} from "../controllers/treeController.js";

const router = express.Router();

router.get("/tree", getTree);
router.post("/tree", createTree);

export default router;