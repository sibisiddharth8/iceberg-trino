import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { executeSqlQuery } from "../services/query.service.js";
import { AppError } from "../errors/AppError.js";

export const executeQueryController: RequestHandler = asyncHandler(
  async (req, res) => {
    const { query, limit } = req.body;

    if (!query || typeof query !== "string") {
      throw new AppError(400, "SQL 'query' string is required.", "MISSING_QUERY");
    }

    const rowLimit = limit ? Number(limit) : 1000;
    const result = await executeSqlQuery(query, rowLimit);

    res.status(200).json(
      apiResponse(result, "Query executed successfully")
    );
  }
);

