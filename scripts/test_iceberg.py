import os
from pathlib import Path
from pyiceberg.catalog import load_catalog

def _load_env_file():
    for p in [Path(".env"), Path("backend/.env"), Path("../backend/.env")]:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            if k not in os.environ:
                                os.environ[k] = v.strip().strip("'\"")
            except Exception:
                pass

_load_env_file()

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "minioadmin")
MINIO_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin123")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ICEBERG_REST_URI = os.getenv("ICEBERG_REST_URI", "http://localhost:8181")
ICEBERG_WAREHOUSE = os.getenv("ICEBERG_WAREHOUSE", "s3://finance-lake/warehouse/")
ICEBERG_CATALOG_NAME = os.getenv("ICEBERG_CATALOG_NAME", "finance")
DEFAULT_NAMESPACE = os.getenv("DEFAULT_NAMESPACE", "banking")

catalog = load_catalog(
    ICEBERG_CATALOG_NAME,
    type="rest",
    uri=ICEBERG_REST_URI,
    warehouse=ICEBERG_WAREHOUSE,
    **{
        "s3.endpoint": MINIO_ENDPOINT,
        "s3.access-key-id": MINIO_ACCESS_KEY,
        "s3.secret-access-key": MINIO_SECRET_KEY,
        "s3.region": AWS_REGION,
        "s3.path-style-access": "true",
    }
)

print(f"Connected to Iceberg catalog '{ICEBERG_CATALOG_NAME}' at {ICEBERG_REST_URI}!")

print("\nAvailable namespaces:")
for namespace in catalog.list_namespaces():
    print(namespace)

print(f"\nAvailable tables in '{DEFAULT_NAMESPACE}':")
for table in catalog.list_tables(DEFAULT_NAMESPACE):
    print(table)
