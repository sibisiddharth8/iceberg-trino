import type {
  ApiResponse,
  PaginatedApiResponse,
  PaginationMeta,
} from "../types/api.types.js";

export function apiResponse<T>(
  data: T,
  message = "Request successful"
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message = "Records retrieved successfully"
): PaginatedApiResponse<T> {
  return {
    success: true,
    message,
    data,
    pagination,
  };
}