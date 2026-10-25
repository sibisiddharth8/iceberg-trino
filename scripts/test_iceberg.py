from pyiceberg.catalog import load_catalog

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

print("Connected to Iceberg catalog!")

print("\nAvailable schemas:")
for namespace in catalog.list_namespaces():
    print(namespace)

print("\nAvailable tables:")
for table in catalog.list_tables("banking"):
    print(table)