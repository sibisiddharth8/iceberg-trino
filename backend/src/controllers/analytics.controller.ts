import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAnalyticsOverview } from "../services/analytics.service.js";

export const analyticsOverviewController: RequestHandler = asyncHandler(
  async (_req, res) => {
    const data = await getAnalyticsOverview();

    res.status(200).json({
      success: true,
      data,
    });
  }
);