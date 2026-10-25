import { z } from "zod";

const optionalText = z.string().trim().min(1).max(100).optional();

const booleanFilter = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const transactionQuerySchema = z
  .strictObject({
    // Hybrid pagination
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().min(1).max(2048).optional(),

    // Search
    search: optionalText,

    // Date filters
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),

    // Amount filters
    minAmount: z.coerce.number().finite().nonnegative().optional(),
    maxAmount: z.coerce.number().finite().nonnegative().optional(),

    // Transaction filters
    state: optionalText,
    transactionType: optionalText,
    channel: optionalText,
    status: optionalText,
    direction: z.enum(["Credit", "Debit"]).optional(),
    accountType: optionalText,

    // Boolean filters
    isFraud: booleanFilter,
    hasLoan: booleanFilter,
  })
  .refine(
    (data) => !(data.page !== undefined && data.cursor !== undefined),
    {
      message: "Cannot use page and cursor together",
      path: ["cursor"],
    }
  )
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.startDate <= data.endDate,
    {
      message: "startDate must be before or equal to endDate",
      path: ["endDate"],
    }
  )
  .refine(
    (data) =>
      data.minAmount === undefined ||
      data.maxAmount === undefined ||
      data.minAmount <= data.maxAmount,
    {
      message: "minAmount cannot exceed maxAmount",
      path: ["maxAmount"],
    }
  );

export type TransactionQuery = z.infer<typeof transactionQuerySchema>;