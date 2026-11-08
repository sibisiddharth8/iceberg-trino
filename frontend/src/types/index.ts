export interface ColumnMeta {
  name: string;
  type: string;
}

export interface TableSummary {
  identifier: string;
  namespace: string;
  tableName: string;
  totalRows: number;
  snapshotCount: number;
  currentSnapshotId: string | null;
  columns: ColumnMeta[];
}

export interface SnapshotHistoryItem {
  snapshotId: string;
  timestampMs: number;
  createdAt: string;
  operation: string;
  addedRecords: string | null;
  totalRecords: string | null;
}

export interface SampleItem {
  id: string;
  name: string;
  s3Uri: string;
  targetTable: string;
  records: number;
  description: string;
  tag: string;
}

export interface IngestResponseData {
  success: boolean;
  action: "created" | "appended";
  table: string;
  namespace: string;
  tableName: string;
  snapshotId: string | null;
  rowsAdded: number;
  totalRows: number;
  schema: ColumnMeta[];
  message: string;
}

export interface SchemaMismatchDetails {
  isMatch: boolean;
  missingColumns: string[];
  extraColumns: string[];
  typeMismatches: Array<{
    column: string;
    expectedType: string;
    actualType: string;
  }>;
}

export interface QueryResultData {
  columns: ColumnMeta[];
  rows: unknown[][];
  rowCount: number;
  durationMs: number;
  queryId?: string;
}

