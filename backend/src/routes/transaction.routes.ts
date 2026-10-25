import { Router } from "express";

import { validateQuery } from "../middlewares/validate.middleware.js";
import { transactionQuerySchema } from "../validators/transaction.validator.js";
import { getTransactionsController } from "../controllers/transaction.controller.js";

const router = Router();

router.get(
  "/",
  validateQuery(transactionQuerySchema),
  getTransactionsController
);

export default router;