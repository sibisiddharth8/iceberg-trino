import type { RequestHandler } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { getTransactions } from "../services/transaction.service.js";
import type { TransactionQuery } from "../validators/transaction.validator.js";

export const getTransactionsController: RequestHandler = asyncHandler(
  async (_req, res) => {
    // Already validated and transformed by Zod middleware
    const query = res.locals.validatedQuery as TransactionQuery;

    // Fetch filtered and paginated records from Trino
    const result = await getTransactions(query);

    res.status(200).json(
      apiResponse(result, "Transactions retrieved successfully")
    );
  }
);