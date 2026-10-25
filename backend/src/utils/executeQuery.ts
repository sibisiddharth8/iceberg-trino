import { trino } from "../db/trino.js";

export async function executeQuery(sql: string): Promise<unknown[][]> {
  const iterator = await trino.query(sql);

  const rows: unknown[][] = [];

  for await (const result of iterator) {
    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.data) {
      rows.push(...result.data);
    }
  }

  return rows;
}