import { AppError } from "../errors/AppError.js";
import { executeParameterizedQuery } from "../utils/executeParameterizedQuery.js";
import {
  encodeCursor,
  decodeCursor,
  getFilterFingerprint,
} from "../utils/cursor.js";
import type { TransactionQuery } from "../validators/transaction.validator.js";
import type {
  Transaction,
  TransactionListResult,
} from "../types/transaction.types.js";
import type { SqlParam } from "../utils/executeParameterizedQuery.js";

const TABLE = "iceberg.banking.transactions";

const COLUMNS = `
  transaction_id,
  customer_id,
  transaction_date,
  transaction_time,
  account_type,
  transaction_type,
  transaction_amount,
  transaction_direction,
  account_balance,
  merchant_category,
  state,
  credit_score,
  has_loan,
  loan_type,
  emi_amount,
  transaction_status,
  channel,
  kyc_status,
  is_fraud,
  transaction_hour
`;

const ORDER_BY = `
  transaction_date DESC,
  transaction_time DESC,
  transaction_id DESC
`;

function buildFilters(query: TransactionQuery) {
  const conditions: string[] = [];
  const params: SqlParam[] = [];

  const add = (condition: string, value: SqlParam) => {
    conditions.push(condition);
    params.push(value);
  };

  if (query.search) {
    conditions.push(
      "(transaction_id = ? OR customer_id = ?)"
    );
    params.push(query.search, query.search);
  }

  if (query.startDate) {
    add("transaction_date >= CAST(? AS DATE)", query.startDate);
  }

  if (query.endDate) {
    add("transaction_date <= CAST(? AS DATE)", query.endDate);
  }

  if (query.minAmount !== undefined) {
    add("transaction_amount >= ?", query.minAmount);
  }

  if (query.maxAmount !== undefined) {
    add("transaction_amount <= ?", query.maxAmount);
  }

  const textFilters = {
    state: "state",
    transactionType: "transaction_type",
    channel: "channel",
    status: "transaction_status",
    direction: "transaction_direction",
    accountType: "account_type",
  } as const;

  for (const [key, column] of Object.entries(textFilters)) {
    const value = query[key as keyof typeof textFilters];

    if (value !== undefined) {
      add(`${column} = ?`, value);
    }
  }

  if (query.isFraud !== undefined) {
    add("is_fraud = ?", query.isFraud);
  }

  if (query.hasLoan !== undefined) {
    add("has_loan = ?", query.hasLoan);
  }

  return { conditions, params };
}

function mapTransaction(row: unknown[]): Transaction {
  return {
    transactionId: String(row[0]),
    customerId: String(row[1]),
    transactionDate: String(row[2]),
    transactionTime: String(row[3]),
    accountType: row[4] == null ? null : String(row[4]),
    transactionType: row[5] == null ? null : String(row[5]),
    transactionAmount: String(row[6]),
    transactionDirection: row[7] == null ? null : String(row[7]),
    accountBalance: row[8] == null ? null : String(row[8]),
    merchantCategory: row[9] == null ? null : String(row[9]),
    state: row[10] == null ? null : String(row[10]),
    creditScore: row[11] == null ? null : Number(row[11]),
    hasLoan: row[12] === true || row[12] === 1,
    loanType: row[13] == null ? null : String(row[13]),
    emiAmount: row[14] == null ? null : String(row[14]),
    transactionStatus: row[15] == null ? null : String(row[15]),
    channel: row[16] == null ? null : String(row[16]),
    kycStatus: row[17] == null ? null : String(row[17]),
    isFraud: row[18] === true || row[18] === 1,
    transactionHour: row[19] == null ? null : Number(row[19]),
  };
}

export async function getTransactions(
  query: TransactionQuery
): Promise<TransactionListResult> {
  const { page, limit, cursor, ...filters } = query;

  const fingerprint = getFilterFingerprint({
    filters,
    limit,
    order: "date-time-id-desc",
  });

  const { conditions, params } = buildFilters(query);

  const isCursorMode = cursor !== undefined;
  const currentPage = page ?? 1;

  if (cursor) {
    const position = decodeCursor(cursor, fingerprint);

    conditions.push(`
      (
        transaction_date < CAST(? AS DATE)
        OR (
          transaction_date = CAST(? AS DATE)
          AND transaction_time < ?
        )
        OR (
          transaction_date = CAST(? AS DATE)
          AND transaction_time = ?
          AND transaction_id < ?
        )
      )
    `);

    params.push(
      position.date,
      position.date,
      position.time,
      position.date,
      position.time,
      position.id
    );
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Ask for one extra row to determine whether another page exists.
  const fetchLimit = limit + 1;

  const offset = isCursorMode ? 0 : (currentPage - 1) * limit;

  const sql = `
    SELECT ${COLUMNS}
    FROM ${TABLE}
    ${where}
    ORDER BY ${ORDER_BY}
    OFFSET ${offset}
    LIMIT ${fetchLimit}
  `;

  const rows = await executeParameterizedQuery(sql, params);

  const hasNextPage = rows.length > limit;
  const transactions = rows.slice(0, limit).map(mapTransaction);

  const last = transactions.at(-1);

  const nextCursor =
    hasNextPage && last
      ? encodeCursor({
          date: last.transactionDate,
          time: last.transactionTime,
          id: last.transactionId,
          fingerprint,
        })
      : null;

  // Cursor mode does not need an expensive COUNT(*) on every page.
  if (isCursorMode) {
    return {
      transactions,
      pagination: {
        mode: "cursor",
        limit,
        hasNextPage,
        nextCursor,
      },
    };
  }

  // Offset mode provides exact totals for numbered pagination.
  // The cursor condition is absent because cursor and page are exclusive.
  const countQuery = `
    SELECT COUNT(*)
    FROM ${TABLE}
    ${where}
  `;

  const countRows = await executeParameterizedQuery(
    countQuery,
    params
  );

  if (!countRows.length) {
    throw new AppError(
      500,
      "Unable to calculate transaction count",
      "COUNT_FAILED"
    );
  }

  const total = Number(countRows[0][0]);
  const totalPages = Math.ceil(total / limit);

  return {
    transactions,
    pagination: {
      mode: "offset",
      page: currentPage,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage: currentPage > 1,
      nextCursor,
    },
  };
}