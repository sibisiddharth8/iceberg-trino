import pyarrow.parquet as pq

file = pq.ParquetFile("data/transactions.parquet")

print("=== PARQUET SCHEMA ===")
print(file.schema_arrow)

print("\n=== TOTAL ROWS ===")
print(file.metadata.num_rows)

print("\n=== SAMPLE RECORDS ===")
print(file.read_row_group(0).slice(0, 3).to_pandas().to_string(index=False))