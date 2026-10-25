import { executeQuery } from "./executeQuery.js";

export type SqlParam = string | number | boolean;

function toSqlLiteral(value: SqlParam): string {
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Invalid numeric SQL parameter");
    }
    return String(value);
  }

  return `'${value.replace(/'/g, "''")}'`;
}

export async function executeParameterizedQuery(
  sql: string,
  params: SqlParam[]
): Promise<unknown[][]> {
  // SQL text is a literal passed to Trino's EXECUTE IMMEDIATE.
  const statement = sql.replace(/'/g, "''");

  if (!params.length) {
    return executeQuery(sql);
  }

  const values = params.map(toSqlLiteral).join(", ");

  return executeQuery(
    `EXECUTE IMMEDIATE '${statement}' USING ${values}`
  );
}