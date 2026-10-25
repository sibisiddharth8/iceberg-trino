from pathlib import Path

import pandas as pd
import pyarrow as pa

source = Path("data/transactions.parquet")

df = pd.read_parquet(source)

# Convert date strings into actual dates
df["transaction_date"] = pd.to_datetime(
    df["transaction_date"], errors="raise"
).dt.date

# Convert integer flags into booleans
for column in ["has_loan", "is_fraud"]:
    df[column] = df[column].astype(bool)

# Prepare monetary values with exact decimal representation
from decimal import Decimal

for column in ["transaction_amount", "account_balance", "emi_amount"]:
    df[column] = df[column].apply(
        lambda value: Decimal(str(value)).quantize(Decimal("0.01"))
        if pd.notna(value) else None
    )

# Build an Arrow table with appropriate monetary types
schema = pa.schema([
    pa.field("transaction_id", pa.string()),
    pa.field("customer_id", pa.string()),
    pa.field("transaction_date", pa.date32()),
    pa.field("transaction_time", pa.string()),
    pa.field("account_type", pa.string()),
    pa.field("transaction_type", pa.string()),
    pa.field("transaction_amount", pa.decimal128(18, 2)),
    pa.field("transaction_direction", pa.string()),
    pa.field("account_balance", pa.decimal128(18, 2)),
    pa.field("merchant_category", pa.string()),
    pa.field("state", pa.string()),
    pa.field("credit_score", pa.int64()),
    pa.field("has_loan", pa.bool_()),
    pa.field("loan_type", pa.string()),
    pa.field("emi_amount", pa.decimal128(18, 2)),
    pa.field("transaction_status", pa.string()),
    pa.field("channel", pa.string()),
    pa.field("kyc_status", pa.string()),
    pa.field("is_fraud", pa.bool_()),
    pa.field("transaction_hour", pa.int64()),
])

table = pa.Table.from_pandas(df, schema=schema, preserve_index=False)

output = Path("data/transactions_clean.parquet")

import pyarrow.parquet as pq
pq.write_table(table, output)

print("Data preparation successful!")
print(f"Total rows: {table.num_rows:,}")
print(f"Total columns: {table.num_columns}")
print(f"Saved to: {output}")