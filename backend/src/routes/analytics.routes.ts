import { Router } from "express";
import { analyticsOverviewController } from "../controllers/analytics.controller.js";

const router = Router();

router.get("/overview", analyticsOverviewController);

export default router;