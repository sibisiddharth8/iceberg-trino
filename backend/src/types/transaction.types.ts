export interface Transaction {
  transactionId: string;
  customerId: string;
  transactionDate: string;
  transactionTime: string;
  accountType: string | null;
  transactionType: string | null;
  transactionAmount: string;
  transactionDirection: string | null;
  accountBalance: string | null;
  merchantCategory: string | null;
  state: string | null;
  creditScore: number | null;
  hasLoan: boolean;
  loanType: string | null;
  emiAmount: string | null;
  transactionStatus: string | null;
  channel: string | null;
  kycStatus: string | null;
  isFraud: boolean;
  transactionHour: number | null;
}

export interface TransactionPagination {
  mode: "offset" | "cursor";
  limit: number;
  hasNextPage: boolean;
  nextCursor: string | null;
  page?: number;
  total?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
}

export interface TransactionListResult {
  transactions: Transaction[];
  pagination: TransactionPagination;
}