import { executeQuery } from "../utils/executeQuery.js";
import type { AnalyticsOverview } from "../types/analytics.types.js";

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const sql = `
    SELECT
      COUNT(*) AS total_transactions,
      COUNT(DISTINCT customer_id) AS unique_customers,
      SUM(transaction_amount) AS total_volume
    FROM iceberg.banking.transactions
  `;

  const rows = await executeQuery(sql);

  if (rows.length !== 1) {
    throw new Error("Unexpected analytics query result");
  }

  const [totalTransactions, uniqueCustomers, totalVolume] = rows[0];

  return {
    totalTransactions: Number(totalTransactions),
    uniqueCustomers: Number(uniqueCustomers),
    totalVolume: String(totalVolume ?? "0"),
  };
}