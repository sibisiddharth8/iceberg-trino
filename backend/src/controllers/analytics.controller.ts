import type { Request, Response, NextFunction } from "express";
import { getAnalyticsOverview } from "../services/analytics.service.js";

export async function analyticsOverviewController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getAnalyticsOverview();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}