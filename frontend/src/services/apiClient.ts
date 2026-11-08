import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export class AppApiError extends Error {
  code: string;
  statusCode?: number;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 120000, // 2 minutes timeout for wide analytics scans or table ingestion
  headers: {
    'Accept': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add request metadata timestamp
    config.headers.set('X-Request-Timestamp', new Date().toISOString());

    // If uploading FormData, let browser set boundary automatically
    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type');
    } else {
      config.headers.set('Content-Type', 'application/json');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.data?.error) {
      const errPayload = error.response.data.error;
      const message = errPayload.message || 'An unexpected error occurred';
      const code = errPayload.code || 'API_ERROR';
      const details = errPayload.details;

      return Promise.reject(
        new AppApiError(message, code, error.response.status, details)
      );
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(
        new AppApiError(
          'Query or operation timed out after 120 seconds.',
          'TIMEOUT_ERROR',
          408
        )
      );
    }

    const fallbackMsg =
      error.message || 'Network error: Unable to connect to server';
    return Promise.reject(
      new AppApiError(fallbackMsg, error.code || 'NETWORK_ERROR', error.response?.status)
    );
  }
);

export default apiClient;

