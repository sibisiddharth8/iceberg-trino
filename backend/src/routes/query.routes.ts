import { Router } from "express";
import { executeQueryController } from "../controllers/query.controller.js";

const router = Router();

router.post("/execute", executeQueryController);

export default router;

