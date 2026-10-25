import pyarrow.parquet as pq
from pyiceberg.catalog import load_catalog

# 1. Connect to Iceberg
catalog = load_catalog(
    "finance",
    type="rest",
    uri="http://localhost:8181",
    warehouse="s3://finance-lake/warehouse/",
    **{
        "s3.endpoint": "http://localhost:9000",
        "s3.access-key-id": "minioadmin",
        "s3.secret-access-key": "minioadmin123",
        "s3.region": "us-east-1",
        "s3.path-style-access": "true",
    }
)

# 2. Load the Iceberg table
table = catalog.load_table("banking.transactions")

# 3. Read our cleaned Parquet dataset
data = pq.read_table("data/transactions_clean.parquet")

print(f"Rows to import: {data.num_rows:,}")

# 4. Prevent accidental duplicate imports
existing_rows = table.scan().count()

if existing_rows > 0:
    print(f"Table already contains {existing_rows:,} rows.")
    print("Skipping import to prevent duplicate records.")
else:
    # 5. Write data into Iceberg
    print("Importing transactions...")
    table.append(data)

    # 6. Verify
    table.refresh()
    total = table.scan().count()

    print("Import successful!")
    print(f"Total Iceberg records: {total:,}")