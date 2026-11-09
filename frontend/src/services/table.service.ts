import apiClient from './apiClient';
import type {
  ApiResponseEnvelope,
  TableSummary,
  SampleItem,
  SnapshotHistoryItem,
  IngestResponseData,
} from '../types';

export interface IngestLinkPayload {
  source: string;
  tableName: string;
  namespace?: string;
}

export const tableService = {
  /**
   * Fetches all registered Apache Iceberg tables and their column schemas.
   */
  async listTables(): Promise<TableSummary[]> {
    const response = await apiClient.get<ApiResponseEnvelope<TableSummary[]>>('/tables');
    return response.data.data;
  },

  /**
   * Fetches predefined 1-click sample Parquet file scenarios.
   */
  async getSamples(): Promise<SampleItem[]> {
    const response = await apiClient.get<ApiResponseEnvelope<SampleItem[]>>('/tables/samples');
    return response.data.data;
  },

  /**
   * Retrieves snapshot version history & commit deltas for a specific table.
   */
  async getTableHistory(tableName: string, namespace = 'banking'): Promise<SnapshotHistoryItem[]> {
    const response = await apiClient.get<ApiResponseEnvelope<SnapshotHistoryItem[]>>(
      `/tables/${encodeURIComponent(tableName)}/history`,
      {
        params: { namespace },
      }
    );
    return response.data.data;
  },

  /**
   * Ingests a Parquet dataset from a MinIO S3 URI or direct HTTP link.
   */
  async ingestParquetLink(payload: IngestLinkPayload): Promise<IngestResponseData> {
    const response = await apiClient.post<ApiResponseEnvelope<IngestResponseData>>(
      '/tables/ingest',
      payload
    );
    return response.data.data;
  },

  /**
   * Uploads a local .parquet file from desktop and triggers Iceberg ingestion.
   */
  async uploadAndIngestParquet(
    file: File,
    tableName: string,
    namespace = 'banking'
  ): Promise<IngestResponseData> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tableName', tableName);
    formData.append('namespace', namespace);

    const response = await apiClient.post<ApiResponseEnvelope<IngestResponseData>>(
      '/tables/ingest',
      formData
    );
    return response.data.data;
  },

  /**
   * Drops a specific table from the catalog and purges its warehouse files.
   */
  async dropTable(tableName: string, namespace = 'banking'): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<ApiResponseEnvelope<{ success: boolean; message: string }>>(
      `/tables/${encodeURIComponent(tableName)}`,
      { params: { namespace } }
    );
    return response.data.data;
  },

  /**
   * Wipes all Iceberg tables and clears the warehouse data in MinIO.
   */
  async clearAllTables(): Promise<{ success: boolean; dropped: string[]; message: string }> {
    const response = await apiClient.post<ApiResponseEnvelope<{ success: boolean; dropped: string[]; message: string }>>(
      '/tables/clear'
    );
    return response.data.data;
  },
};

export default tableService;

