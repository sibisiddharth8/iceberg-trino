import type { RequestHandler } from "express";
import fs from "node:fs/promises";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../errors/AppError.js";
import {
  ingestParquet,
  listIcebergTables,
  getTableHistory,
} from "../services/iceberg.service.js";

export const ingestTableController: RequestHandler = asyncHandler(
  async (req, res) => {
    let source = req.body?.source;
    const uploadedFile = req.file;

    if (uploadedFile) {
      source = uploadedFile.path;
    }

    if (!source) {
      throw new AppError(
        400,
        "Please provide a MinIO S3 path/URL or upload a Parquet file.",
        "MISSING_SOURCE"
      );
    }

    let tableName = req.body?.tableName?.trim();
    if (!tableName && uploadedFile) {
      // derive from filename without extension
      tableName = uploadedFile.originalname.replace(/\.[^/.]+$/, "");
    }

    if (!tableName) {
      throw new AppError(400, "tableName is required.", "MISSING_TABLE_NAME");
    }

    // Sanitize table name (letters, numbers, underscores)
    tableName = tableName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();

    const namespace = req.body?.namespace?.trim() || "banking";

    try {
      const result = await ingestParquet({
        source,
        tableName,
        namespace,
      });

      res.status(200).json(apiResponse(result, result.message));
    } finally {
      // If a temporary file was uploaded via form-data, clean it up after ingest
      if (uploadedFile) {
        fs.unlink(uploadedFile.path).catch(() => {});
      }
    }
  }
);

export const listTablesController: RequestHandler = asyncHandler(
  async (_req, res) => {
    const tables = await listIcebergTables();
    res.status(200).json(apiResponse(tables, "Tables retrieved successfully"));
  }
);

export const getTableHistoryController: RequestHandler = asyncHandler(
  async (req, res) => {
    const rawTableName = req.params.tableName;
    const tableName = Array.isArray(rawTableName) ? rawTableName[0] : rawTableName;
    const namespace = (req.query.namespace as string) || "banking";

    if (!tableName) {
      throw new AppError(400, "Table name is required", "MISSING_PARAM");
    }

    const history = await getTableHistory(tableName, namespace);
    res.status(200).json(
      apiResponse(history, `History for ${tableName} retrieved successfully`)
    );
  }
);

export const getSamplesController: RequestHandler = asyncHandler(
  async (_req, res) => {
    const samples = [
      {
        id: "tx-v1",
        name: "Transactions V1 (Initial Table)",
        s3Uri: "s3://finance-lake/uploads/transactions_v1.parquet",
        targetTable: "transactions",
        records: 50,
        description: "Creates 'transactions' table with 50 records and sets baseline schema (Version 1)",
        tag: "Base Schema (V1)",
      },
      {
        id: "tx-v2",
        name: "Transactions V2 (Version +100 Rows)",
        s3Uri: "s3://finance-lake/uploads/transactions_v2.parquet",
        targetTable: "transactions",
        records: 100,
        description: "Appends 100 records to 'transactions' (matching schema). Total becomes 150 records (Version 2)",
        tag: "Append (V2)",
      },
      {
        id: "tx-mismatch",
        name: "Transactions Mismatch (Schema Error Test)",
        s3Uri: "s3://finance-lake/uploads/transactions_mismatch.parquet",
        targetTable: "transactions",
        records: 20,
        description: "Intentionally mismatched columns (fraud_risk_score instead of transaction_hour) to test error handling",
        tag: "Error Test",
      },
      {
        id: "cust",
        name: "Customers (For Relational JOINs)",
        s3Uri: "s3://finance-lake/uploads/customers.parquet",
        targetTable: "customers",
        records: 500,
        description: "Creates 'customers' table with 500 customer profiles sharing customer_id with transactions",
        tag: "JOIN Table",
      },
    ];

    res.status(200).json(
      apiResponse(samples, "Sample Parquet files retrieved successfully")
    );
  }
);
