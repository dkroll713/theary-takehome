import express from "express";
import db from "./repository/sqliteRepository.js";
import { Root, Node } from "./interfaces/interfaces.js"
import createTreeNodeSchema from "./schemas/CreateTreeNodeSchema.js";
import treeRoutes from "./routes/treeRoutes.js";

const app = express();

const PORT = 3000;

app.use(express.json());

app.use("/api", treeRoutes);


export default app;