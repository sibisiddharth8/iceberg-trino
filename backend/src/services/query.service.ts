import { trino } from "../db/trino.js";
import { AppError } from "../errors/AppError.js";

export interface ColumnMeta {
  name: string;
  type: string;
}

export interface QueryExecutionResult {
  columns: ColumnMeta[];
  rows: unknown[][];
  rowCount: number;
  durationMs: number;
  queryId?: string;
}

export async function executeSqlQuery(
  sql: string,
  maxRows = 1000
): Promise<QueryExecutionResult> {
  let cleanSql = sql.trim();
  if (!cleanSql) {
    throw new AppError(400, "Query cannot be empty", "EMPTY_QUERY");
  }

  // Strip trailing semicolons (Trino REST API expects no trailing semicolon)
  while (cleanSql.endsWith(";")) {
    cleanSql = cleanSql.slice(0, -1).trim();
  }

  // Basic security check: disallow destructive queries from query builder
  const forbiddenKeywords = ["DROP TABLE", "DELETE FROM", "TRUNCATE TABLE", "ALTER TABLE"];
  const upperSql = cleanSql.toUpperCase();
  for (const kw of forbiddenKeywords) {
    if (upperSql.includes(kw)) {
      throw new AppError(
        403,
        `Operation '${kw}' is not permitted in the query builder.`,
        "FORBIDDEN_QUERY"
      );
    }
  }

  const startTime = Date.now();
  let queryId: string | undefined;
  let columns: ColumnMeta[] = [];
  const rows: unknown[][] = [];

  try {
    const iterator = await trino.query(cleanSql);

    for await (const result of iterator) {
      if (result.id && !queryId) {
        queryId = result.id;
      }

      if (result.error) {
        throw new AppError(
          400,
          result.error.message || "Query execution failed",
          result.error.errorName || "QUERY_EXECUTION_ERROR",
          result.error
        );
      }

      if (result.columns && columns.length === 0) {
        columns = result.columns.map((c) => ({
          name: c.name,
          type: c.type,
        }));
      }

      if (result.data) {
        for (const row of result.data) {
          if (rows.length < maxRows) {
            rows.push(row);
          }
        }
      }
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      400,
      error.message || "Failed to execute query",
      "QUERY_ERROR"
    );
  }

  const durationMs = Date.now() - startTime;

  return {
    columns,
    rows,
    rowCount: rows.length,
    durationMs,
    queryId,
  };
}

