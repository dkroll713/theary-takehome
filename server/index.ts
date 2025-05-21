import express from "express";
import treeRoutes from "./routes/treeRoutes.js";

const app = express();

app.use(express.json());

app.use("/api", treeRoutes);


export default app;