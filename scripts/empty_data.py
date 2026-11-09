#!/usr/bin/env python3
"""
Lakehouse Data Reset / Purge Utility
====================================
Drops all registered Apache Iceberg tables in the catalog and purges
all warehouse files from MinIO (S3) while keeping test uploads intact.

Usage:
    python scripts/empty_data.py
    # or
    .\empty_data.ps1
    # or
    empty_data.bat
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

def _load_env_file():
    for p in [root_dir / ".env", root_dir / "backend/.env"]:
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
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "finance-lake")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ICEBERG_REST_URI = os.getenv("ICEBERG_REST_URI", "http://localhost:8181")
ICEBERG_WAREHOUSE = os.getenv("ICEBERG_WAREHOUSE", "s3://finance-lake/warehouse/")
ICEBERG_CATALOG_NAME = os.getenv("ICEBERG_CATALOG_NAME", "finance")

def get_s3():
    import s3fs
    return s3fs.S3FileSystem(
        key=MINIO_ACCESS_KEY,
        secret=MINIO_SECRET_KEY,
        client_kwargs={"endpoint_url": MINIO_ENDPOINT},
    )

def get_catalog():
    from pyiceberg.catalog import load_catalog
    return load_catalog(
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
        },
    )

def empty_lakehouse():
    print("=" * 64)
    print("       APACHE ICEBERG LAKEHOUSE DATA RESET UTILITY")
    print("=" * 64)

    # 1. Connect to PyIceberg Catalog
    print("\n[1/3] Connecting to Iceberg REST Catalog...")
    dropped_tables = []
    try:
        catalog = get_catalog()
        namespaces = catalog.list_namespaces()
        for ns_tuple in namespaces:
            ns = ns_tuple[0]
            tables = catalog.list_tables(ns)
            for tbl in tables:
                ident_str = f"{tbl[0]}.{tbl[1]}"
                try:
                    catalog.drop_table(tbl)
                    dropped_tables.append(ident_str)
                    print(f"  [✓] Dropped Iceberg table: {ident_str}")
                except Exception as e:
                    print(f"  [!] Failed to drop {ident_str}: {e}")
        
        if not dropped_tables:
            print("  [i] Catalog is already clean (0 active tables).")
    except Exception as e:
        print(f"  [!] Warning while accessing catalog: {e}")

    # 2. Clear Warehouse Storage in MinIO
    print("\n[2/3] Clearing Warehouse Storage in MinIO...")
    s3 = get_s3()
    warehouse_prefix = f"{MINIO_BUCKET}/warehouse"
    try:
        if s3.exists(warehouse_prefix):
            s3.rm(warehouse_prefix, recursive=True)
            print(f"  [✓] Removed directory: s3://{warehouse_prefix}")
        else:
            print(f"  [i] Warehouse directory s3://{warehouse_prefix} is already empty.")
    except Exception as e:
        print(f"  [!] Error cleaning warehouse: {e}")

    # 3. Verify & Ensure Test Parquet Files in Uploads
    print("\n[3/3] Verifying Source Test Datasets in MinIO...")
    uploads_prefix = f"{MINIO_BUCKET}/uploads"
    required_files = [
        "transactions_v1.parquet",
        "transactions_v2.parquet",
        "transactions_mismatch.parquet",
        "customers.parquet",
    ]

    try:
        if not s3.exists(uploads_prefix):
            s3.mkdir(uploads_prefix)

        existing_uploads = [Path(p).name for p in s3.ls(uploads_prefix)]
        missing = [f for f in required_files if f not in existing_uploads]

        if missing:
            print(f"  [!] Re-uploading missing test datasets from local 'data/parquet/': {missing}")
            for m in missing:
                local_f = root_dir / "data" / "parquet" / m
                if local_f.exists():
                    s3.put(str(local_f), f"{uploads_prefix}/{m}")
                    print(f"      [+] Uploaded {m} -> s3://{uploads_prefix}/{m}")
                else:
                    print(f"      [-] Local source {local_f} not found!")
        else:
            print("  [✓] All 4 source Parquet test files intact in s3://" + uploads_prefix)

        for f in required_files:
            target = f"{uploads_prefix}/{f}"
            if s3.exists(target):
                size = s3.info(target).get("size", 0)
                print(f"      • s3://{target} ({size:,} bytes)")
    except Exception as e:
        print(f"  [!] Note on uploads verification: {e}")

    print("\n" + "=" * 64)
    print(f" SUCCESS: Lakehouse purged! Dropped {len(dropped_tables)} tables.")
    print(" Warehouse is empty. Ready for fresh 1-click POC ingestion.")
    print("=" * 64 + "\n")

if __name__ == "__main__":
    empty_lakehouse()

