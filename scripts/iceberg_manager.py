import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import pyarrow as pa
import pyarrow.parquet as pq
from pyiceberg.catalog import load_catalog
from pyiceberg.exceptions import NoSuchNamespaceError, NoSuchTableError
import s3fs

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

def get_s3_fs() -> s3fs.S3FileSystem:
    return s3fs.S3FileSystem(
        key=MINIO_ACCESS_KEY,
        secret=MINIO_SECRET_KEY,
        client_kwargs={"endpoint_url": MINIO_ENDPOINT},
    )

def get_catalog():
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

def parse_source_path(source: str) -> Tuple[bool, str]:
    """
    Returns (is_local, clean_path_or_s3_uri).
    Supports:
    - local paths: data/parquet/file.parquet, C:/..., etc.
    - s3 paths: s3://bucket/key
    - minio URLs: http://localhost:9000/bucket/key
    - bucket/key
    """
    s = source.strip()
    if s.startswith("http://") or s.startswith("https://"):
        # e.g. http://localhost:9000/finance-lake/uploads/file.parquet
        parts = s.split("://", 1)[1].split("/", 1)
        if len(parts) > 1:
            return (False, f"s3://{parts[1]}")
        return (False, s)

    if s.startswith("s3://"):
        return (False, s)

    local_path = Path(s)
    if local_path.exists():
        return (True, str(local_path.resolve()))

    # Treat as s3://... if format bucket/key
    clean = s.lstrip("/")
    return (False, f"s3://{clean}")

def normalize_arrow_type(t: pa.DataType) -> str:
    if pa.types.is_string(t) or pa.types.is_large_string(t):
        return "string"
    if pa.types.is_date(t):
        return "date"
    if pa.types.is_boolean(t):
        return "boolean"
    if pa.types.is_decimal(t):
        return f"decimal({t.precision}, {t.scale})"
    if pa.types.is_integer(t):
        return str(t)
    if pa.types.is_floating(t):
        return "double" if pa.types.is_float64(t) else "float"
    if pa.types.is_timestamp(t):
        return "timestamp"
    return str(t)

def compare_schemas(
    expected_fields: List[Tuple[str, pa.DataType]],
    actual_fields: List[Tuple[str, pa.DataType]],
) -> Dict[str, Any]:
    expected_map = {name: normalize_arrow_type(t) for name, t in expected_fields}
    actual_map = {name: normalize_arrow_type(t) for name, t in actual_fields}

    missing = [f for f in expected_map if f not in actual_map]
    extra = [f for f in actual_map if f not in expected_map]
    type_mismatches = []

    for f in expected_map:
        if f in actual_map and expected_map[f] != actual_map[f]:
            type_mismatches.append({
                "column": f,
                "expectedType": expected_map[f],
                "actualType": actual_map[f],
            })

    is_match = not (missing or extra or type_mismatches)
    return {
        "isMatch": is_match,
        "missingColumns": missing,
        "extraColumns": extra,
        "typeMismatches": type_mismatches,
    }

def read_parquet_table(is_local: bool, path: str) -> pa.Table:
    if is_local:
        return pq.read_table(path)
    
    # S3 path
    s3_path = path.replace("s3://", "")
    s3 = get_s3_fs()
    with s3.open(s3_path, "rb") as f:
        return pq.read_table(f)

def format_snapshot(snap: Any) -> Dict[str, Any]:
    timestamp_s = snap.timestamp_ms / 1000.0
    dt = datetime.fromtimestamp(timestamp_s, tz=timezone.utc)
    summary = snap.summary.additional_properties if hasattr(snap.summary, "additional_properties") else {}
    operation = str(getattr(snap.summary, "operation", "UNKNOWN")).replace("Operation.", "")
    
    return {
        "snapshotId": str(snap.snapshot_id),
        "timestampMs": snap.timestamp_ms,
        "createdAt": dt.isoformat(),
        "operation": operation,
        "addedRecords": summary.get("added-records", None),
        "totalRecords": summary.get("total-records", None),
    }

def handle_ingest(args):
    catalog = get_catalog()
    namespace = args.namespace.strip()
    table_name = args.table.strip()
    identifier = f"{namespace}.{table_name}"
    source = args.source.strip()

    is_local, resolved_path = parse_source_path(source)

    try:
        data = read_parquet_table(is_local, resolved_path)
    except Exception as e:
        result = {
            "success": False,
            "error": "READ_ERROR",
            "message": f"Failed to read Parquet file at '{source}': {str(e)}",
        }
        print(json.dumps(result))
        sys.exit(1)

    # Ensure namespace exists
    try:
        catalog.create_namespace(namespace)
    except Exception:
        pass

    table_exists = False
    table = None
    try:
        table = catalog.load_table(identifier)
        table_exists = True
    except (NoSuchTableError, NoSuchNamespaceError):
        table_exists = False

    schema_fields = [
        {"name": f.name, "type": normalize_arrow_type(f.type)}
        for f in data.schema
    ]

    if not table_exists:
        # Initial creation: Freeze schema based on this first upload
        try:
            table = catalog.create_table(
                identifier,
                schema=data.schema,
                properties={"write.format.default": "parquet"},
            )
            table.append(data)
            table.refresh()

            current_snapshot = table.current_snapshot()
            total_rows = data.num_rows

            result = {
                "success": True,
                "action": "created",
                "table": identifier,
                "namespace": namespace,
                "tableName": table_name,
                "snapshotId": str(current_snapshot.snapshot_id) if current_snapshot else None,
                "rowsAdded": data.num_rows,
                "totalRows": total_rows,
                "schema": schema_fields,
                "message": f"Table '{identifier}' created successfully with {data.num_rows} records (Version 1).",
            }
            print(json.dumps(result))
            sys.exit(0)
        except Exception as e:
            result = {
                "success": False,
                "error": "CREATE_ERROR",
                "message": f"Failed to create Iceberg table: {str(e)}",
            }
            print(json.dumps(result))
            sys.exit(1)
    else:
        # Table exists: Validate schema against established Iceberg table schema
        from pyiceberg.io.pyarrow import schema_to_pyarrow
        existing_arrow_schema = schema_to_pyarrow(table.schema())

        comparison = compare_schemas(
            [(f.name, f.type) for f in existing_arrow_schema],
            [(f.name, f.type) for f in data.schema],
        )

        if not comparison["isMatch"]:
            reasons = []
            if comparison["missingColumns"]:
                reasons.append(f"Missing columns: {', '.join(comparison['missingColumns'])}")
            if comparison["extraColumns"]:
                reasons.append(f"Unexpected extra columns: {', '.join(comparison['extraColumns'])}")
            for tm in comparison["typeMismatches"]:
                reasons.append(f"Column '{tm['column']}' type mismatch (expected {tm['expectedType']}, got {tm['actualType']})")

            detailed_msg = "Schema mismatch detected! " + "; ".join(reasons)
            result = {
                "success": False,
                "error": "SCHEMA_MISMATCH",
                "message": detailed_msg,
                "table": identifier,
                "differences": comparison,
            }
            print(json.dumps(result))
            sys.exit(1)

        # Schemas match! Append data and generate a new snapshot
        try:
            table.append(data)
            table.refresh()

            current_snapshot = table.current_snapshot()
            total_rows = table.scan().count()

            result = {
                "success": True,
                "action": "appended",
                "table": identifier,
                "namespace": namespace,
                "tableName": table_name,
                "snapshotId": str(current_snapshot.snapshot_id) if current_snapshot else None,
                "rowsAdded": data.num_rows,
                "totalRows": total_rows,
                "schema": schema_fields,
                "message": f"Successfully ingested {data.num_rows} records into '{identifier}'. Total records: {total_rows:,}.",
            }
            print(json.dumps(result))
            sys.exit(0)
        except Exception as e:
            result = {
                "success": False,
                "error": "APPEND_ERROR",
                "message": f"Failed to append records to table: {str(e)}",
            }
            print(json.dumps(result))
            sys.exit(1)

def handle_list_tables(args):
    catalog = get_catalog()
    tables = []
    
    for ns_tuple in catalog.list_namespaces():
        ns = ns_tuple[0]
        for tbl_ident in catalog.list_tables(ns):
            table_obj = catalog.load_table(tbl_ident)
            from pyiceberg.io.pyarrow import schema_to_pyarrow
            arrow_schema = schema_to_pyarrow(table_obj.schema())
            
            columns = [
                {"name": f.name, "type": normalize_arrow_type(f.type)}
                for f in arrow_schema
            ]
            
            snaps = table_obj.snapshots()
            total_rows = 0
            try:
                total_rows = table_obj.scan().count()
            except Exception:
                pass
                
            tables.append({
                "identifier": f"{tbl_ident[0]}.{tbl_ident[1]}",
                "namespace": tbl_ident[0],
                "tableName": tbl_ident[1],
                "totalRows": total_rows,
                "snapshotCount": len(snaps),
                "currentSnapshotId": str(table_obj.current_snapshot().snapshot_id) if table_obj.current_snapshot() else None,
                "columns": columns,
            })
            
    print(json.dumps({"success": True, "tables": tables}))

def handle_history(args):
    catalog = get_catalog()
    identifier = f"{args.namespace.strip()}.{args.table.strip()}"
    try:
        table = catalog.load_table(identifier)
        snapshots = [format_snapshot(s) for s in table.snapshots()]
        # Latest first
        snapshots.reverse()
        print(json.dumps({"success": True, "table": identifier, "history": snapshots}))
    except Exception as e:
        print(json.dumps({"success": False, "error": "NOT_FOUND", "message": str(e)}))
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Iceberg Table Manager Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Ingest command
    ingest_parser = subparsers.add_parser("ingest")
    ingest_parser.add_argument("--source", required=True, help="MinIO S3 path, URL, or local file")
    ingest_parser.add_argument("--table", required=True, help="Target table name")
    ingest_parser.add_argument("--namespace", default=DEFAULT_NAMESPACE, help=f"Iceberg namespace (default: {DEFAULT_NAMESPACE})")

    # List tables command
    subparsers.add_parser("list-tables")

    # History command
    history_parser = subparsers.add_parser("history")
    history_parser.add_argument("--table", required=True, help="Table name")
    history_parser.add_argument("--namespace", default=DEFAULT_NAMESPACE, help=f"Iceberg namespace (default: {DEFAULT_NAMESPACE})")

    args = parser.parse_args()

    if args.command == "ingest":
        handle_ingest(args)
    elif args.command == "list-tables":
        handle_list_tables(args)
    elif args.command == "history":
        handle_history(args)

if __name__ == "__main__":
    main()

