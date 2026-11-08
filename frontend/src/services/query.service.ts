import apiClient from './apiClient';
import type { ApiResponseEnvelope, QueryResultData } from '../types';

export interface ExecuteQueryPayload {
  query: string;
  limit?: number;
}

export const queryService = {
  /**
   * Executes an ANSI SQL statement on Trino and returns tabular results with duration metrics.
   */
  async executeSql(query: string, limit = 500): Promise<QueryResultData> {
    const response = await apiClient.post<ApiResponseEnvelope<QueryResultData>>(
      '/query/execute',
      {
        query,
        limit,
      }
    );
    return response.data.data;
  },
};

export default queryService;

