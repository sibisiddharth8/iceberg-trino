import pyarrow.parquet as pq
from pyiceberg.catalog import load_catalog

# Read the schema without loading all 550K records
schema = pq.read_schema("data/transactions_clean.parquet")

# Connect to our Iceberg REST Catalog
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

# Create the Iceberg table
table = catalog.create_table_if_not_exists(
    identifier="banking.transactions",
    schema=schema,
    properties={"write.format.default": "parquet"},
)

print("Iceberg table ready!")
print(f"Table: {table.name()}")
print(f"Location: {table.location()}")