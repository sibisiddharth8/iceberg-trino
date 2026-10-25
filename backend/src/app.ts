import express from "express";
import cors from "cors";
import "dotenv/config";

import analyticsRoutes from "./routes/analytics.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Finance Analytics API running",
  });
});

app.use("/api/analytics", analyticsRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});