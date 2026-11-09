import { Router } from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import {
  ingestTableController,
  listTablesController,
  getTableHistoryController,
  getSamplesController,
  dropTableController,
  clearAllTablesController,
} from "../controllers/table.controller.js";

const upload = multer({
  dest: path.join(os.tmpdir(), "finance-uploads"),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

const router = Router();

router.get("/", listTablesController);
router.get("/samples", getSamplesController);
router.post("/clear", clearAllTablesController);
router.delete("/:tableName", dropTableController);
router.get("/:tableName/history", getTableHistoryController);
router.post("/ingest", upload.single("file"), ingestTableController);

export default router;

