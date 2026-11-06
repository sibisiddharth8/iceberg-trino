from pathlib import Path
from decimal import Decimal
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

output_dir = Path("data/parquet")
output_dir.mkdir(parents=True, exist_ok=True)

csv_path = Path("data/indian_banking_transactions.csv")
print("Reading source transactions...")
# Read a sample slice to construct clean relational datasets
raw_df = pd.read_csv(csv_path, nrows=5000)

# Normalize transaction_date
raw_df["transaction_date"] = pd.to_datetime(
    raw_df["transaction_date"], format="%d-%m-%Y"
).dt.date

# Convert boolean flags
raw_df["has_loan"] = raw_df["has_loan"].astype(bool)
raw_df["is_fraud"] = raw_df["is_fraud"].astype(bool)

# Decimal conversion helper
def to_decimal(val):
    if pd.isna(val):
        return None
    return Decimal(str(val)).quantize(Decimal("0.01"))

for col in ["transaction_amount", "account_balance", "emi_amount"]:
    raw_df[col] = raw_df[col].apply(to_decimal)

# -------------------------------------------------------------
# 1. CUSTOMERS TABLE (Normalized Entity)
# -------------------------------------------------------------
cust_cols = [
    "customer_id",
    "state",
    "credit_score",
    "kyc_status",
    "has_loan",
    "loan_type",
    "emi_amount",
    "account_type",
]

cust_df = raw_df[cust_cols].drop_duplicates(subset=["customer_id"]).copy()
# Take top 500 unique customers
cust_df = cust_df.head(500)

customer_schema = pa.schema([
    pa.field("customer_id", pa.string(), nullable=False),
    pa.field("state", pa.string(), nullable=True),
    pa.field("credit_score", pa.int64(), nullable=True),
    pa.field("kyc_status", pa.string(), nullable=True),
    pa.field("has_loan", pa.bool_(), nullable=False),
    pa.field("loan_type", pa.string(), nullable=True),
    pa.field("emi_amount", pa.decimal128(18, 2), nullable=True),
    pa.field("account_type", pa.string(), nullable=True),
])

customer_table = pa.Table.from_pandas(cust_df, schema=customer_schema, preserve_index=False)
customers_path = output_dir / "customers.parquet"
pq.write_table(customer_table, customers_path)
print(f"Created {customers_path} ({customer_table.num_rows} rows)")

# Filter transactions so customer_id always belongs to the customers table
valid_cust_ids = set(cust_df["customer_id"])
txn_subset = raw_df[raw_df["customer_id"].isin(valid_cust_ids)].copy()

# -------------------------------------------------------------
# 2. TRANSACTIONS TABLE (Events referencing customers)
# -------------------------------------------------------------
txn_cols = [
    "transaction_id",
    "customer_id",
    "transaction_date",
    "transaction_time",
    "transaction_type",
    "transaction_amount",
    "transaction_direction",
    "account_balance",
    "merchant_category",
    "channel",
    "transaction_status",
    "is_fraud",
    "transaction_hour",
]

txn_schema = pa.schema([
    pa.field("transaction_id", pa.string(), nullable=False),
    pa.field("customer_id", pa.string(), nullable=False),
    pa.field("transaction_date", pa.date32(), nullable=False),
    pa.field("transaction_time", pa.string(), nullable=True),
    pa.field("transaction_type", pa.string(), nullable=True),
    pa.field("transaction_amount", pa.decimal128(18, 2), nullable=False),
    pa.field("transaction_direction", pa.string(), nullable=True),
    pa.field("account_balance", pa.decimal128(18, 2), nullable=True),
    pa.field("merchant_category", pa.string(), nullable=True),
    pa.field("channel", pa.string(), nullable=True),
    pa.field("transaction_status", pa.string(), nullable=True),
    pa.field("is_fraud", pa.bool_(), nullable=False),
    pa.field("transaction_hour", pa.int64(), nullable=True),
])

# Batch 1: 50 rows (Version 1 upload)
txn_v1_df = txn_subset[txn_cols].iloc[0:50]
table_v1 = pa.Table.from_pandas(txn_v1_df, schema=txn_schema, preserve_index=False)
v1_path = output_dir / "transactions_v1.parquet"
pq.write_table(table_v1, v1_path)
print(f"Created {v1_path} ({table_v1.num_rows} rows) [Version 1]")

# Batch 2: 100 rows (Version 2 upload - matching schema)
txn_v2_df = txn_subset[txn_cols].iloc[50:150]
table_v2 = pa.Table.from_pandas(txn_v2_df, schema=txn_schema, preserve_index=False)
v2_path = output_dir / "transactions_v2.parquet"
pq.write_table(table_v2, v2_path)
print(f"Created {v2_path} ({table_v2.num_rows} rows) [Version 2]")

# -------------------------------------------------------------
# 3. MISMATCH FILE (For testing schema mismatch error)
# -------------------------------------------------------------
# Has an extra column "fraud_risk_score" and missing "transaction_hour"
mismatch_df = txn_subset[txn_cols].iloc[150:170].drop(columns=["transaction_hour"]).copy()
mismatch_df["fraud_risk_score"] = 99.5

mismatch_schema = pa.schema([
    pa.field("transaction_id", pa.string(), nullable=False),
    pa.field("customer_id", pa.string(), nullable=False),
    pa.field("transaction_date", pa.date32(), nullable=False),
    pa.field("transaction_time", pa.string(), nullable=True),
    pa.field("transaction_type", pa.string(), nullable=True),
    pa.field("transaction_amount", pa.decimal128(18, 2), nullable=False),
    pa.field("transaction_direction", pa.string(), nullable=True),
    pa.field("account_balance", pa.decimal128(18, 2), nullable=True),
    pa.field("merchant_category", pa.string(), nullable=True),
    pa.field("channel", pa.string(), nullable=True),
    pa.field("transaction_status", pa.string(), nullable=True),
    pa.field("is_fraud", pa.bool_(), nullable=False),
    pa.field("fraud_risk_score", pa.float64(), nullable=True),
])

table_mismatch = pa.Table.from_pandas(mismatch_df, schema=mismatch_schema, preserve_index=False)
mismatch_path = output_dir / "transactions_mismatch.parquet"
pq.write_table(table_mismatch, mismatch_path)
print(f"Created {mismatch_path} ({table_mismatch.num_rows} rows) [Schema Mismatch Test File]")

print("\nAll datasets generated successfully!")

