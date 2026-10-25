import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next
) => {
  if (res.headersSent) {
    return next(error);
  }

  const isAppError = error instanceof AppError;

  const statusCode = isAppError ? error.statusCode : 500;

  if (!isAppError) {
    console.error("Unexpected error:", error);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: isAppError ? error.code : "INTERNAL_SERVER_ERROR",
      message: isAppError
        ? error.message
        : "An unexpected error occurred",
    },
  });
};