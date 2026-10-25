import { transactionQuerySchema } from "../src/validators/transaction.validator.js";

const tests = [
  {
    name: "Default",
    input: {},
  },
  {
    name: "Valid filters",
    input: {
      limit: "25",
      state: "Tamil Nadu",
      isFraud: "false",
      minAmount: "1000",
    },
  },
  {
    name: "Invalid limit",
    input: { limit: "500" },
  },
  {
    name: "Invalid date range",
    input: {
      startDate: "2024-12-31",
      endDate: "2024-01-01",
    },
  },
];

for (const test of tests) {
  const result = transactionQuerySchema.safeParse(test.input);

  console.log(`\n${test.name}:`);

  if (result.success) {
    console.log("VALID:", result.data);
  } else {
    console.log("INVALID:", result.error.issues);
  }
}