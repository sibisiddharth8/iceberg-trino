import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  console.error("API Error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};