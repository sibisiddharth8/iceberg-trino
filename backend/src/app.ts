import express from "express";
import cors from "cors";
import "dotenv/config";

import tableRoutes from "./routes/table.routes.js";
import queryRoutes from "./routes/query.routes.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

import { config } from "./config/env.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Finance Lakehouse API running",
  });
});

app.use("/api/tables", tableRoutes);
app.use("/api/query", queryRoutes);

// Must come after all routes
app.use(notFoundHandler);

// Must come last
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
