import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "../errors/AppError.js";

import { config } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../");

const defaultPython =
  process.platform === "win32"
    ? path.resolve(rootDir, ".venv/Scripts/python.exe")
    : path.resolve(rootDir, ".venv/bin/python");

const pythonPath = config.pythonPath || defaultPython;
const scriptPath = path.resolve(rootDir, "scripts/iceberg_manager.py");

export interface IngestResult {
  success: boolean;
  action: "created" | "appended";
  table: string;
  namespace: string;
  tableName: string;
  snapshotId: string | null;
  rowsAdded: number;
  totalRows: number;
  schema: Array<{ name: string; type: string }>;
  message: string;
}

export interface TableSummary {
  identifier: string;
  namespace: string;
  tableName: string;
  totalRows: number;
  snapshotCount: number;
  currentSnapshotId: string | null;
  columns: Array<{ name: string; type: string }>;
}

export interface SnapshotHistoryItem {
  snapshotId: string;
  timestampMs: number;
  createdAt: string;
  operation: string;
  addedRecords: string | null;
  totalRecords: string | null;
}

export function runIcebergManager<T>(args: string[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [scriptPath, ...args], {
      cwd: rootDir,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(
        new AppError(
          500,
          `Failed to execute Python Iceberg engine: ${err.message}`,
          "PROCESS_SPAWN_ERROR"
        )
      );
    });

    proc.on("close", (code) => {
      let parsed: any = null;
      try {
        if (stdout.trim()) {
          parsed = JSON.parse(stdout.trim());
        }
      } catch {
        // Output was not JSON
      }

      if (code === 0) {
        if (parsed) {
          resolve(parsed as T);
        } else {
          resolve({ success: true, message: stdout.trim() } as unknown as T);
        }
      } else {
        if (parsed && parsed.error) {
          const statusCode = parsed.error === "SCHEMA_MISMATCH" ? 400 : 500;
          reject(
            new AppError(
              statusCode,
              parsed.message || "Iceberg operation failed",
              parsed.error,
              parsed.differences
            )
          );
        } else {
          reject(
            new AppError(
              500,
              stderr.trim() || stdout.trim() || `Process exited with code ${code}`,
              "ICEBERG_EXEC_ERROR"
            )
          );
        }
      }
    });
  });
}

export async function ingestParquet(options: {
  source: string;
  tableName: string;
  namespace?: string;
}): Promise<IngestResult> {
  const args = [
    "ingest",
    "--source",
    options.source,
    "--table",
    options.tableName,
    "--namespace",
    options.namespace || config.iceberg.defaultNamespace,
  ];

  return runIcebergManager<IngestResult>(args);
}

export async function listIcebergTables(): Promise<TableSummary[]> {
  const result = await runIcebergManager<{
    success: boolean;
    tables: TableSummary[];
  }>(["list-tables"]);

  return result.tables;
}

export async function getTableHistory(
  tableName: string,
  namespace = config.iceberg.defaultNamespace
): Promise<SnapshotHistoryItem[]> {
  const result = await runIcebergManager<{
    success: boolean;
    history: SnapshotHistoryItem[];
  }>(["history", "--table", tableName, "--namespace", namespace]);

  return result.history;
}

