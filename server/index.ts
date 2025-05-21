import express from "express";
import treeRoutes from "./routes/treeRoutes.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const swaggerDocument = YAML.load("./openapi.yaml");

const app = express();

app.use(express.json());
app.use("/api", treeRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


export default app;