import os
from pathlib import Path
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
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "finance-lake")

s3 = s3fs.S3FileSystem(
    key=MINIO_ACCESS_KEY,
    secret=MINIO_SECRET_KEY,
    client_kwargs={"endpoint_url": MINIO_ENDPOINT}
)

# Ensure bucket exists
if not s3.exists(MINIO_BUCKET):
    s3.mkdir(MINIO_BUCKET)

local_dir = Path("data/parquet")
files = sorted(list(local_dir.glob("*.parquet")))

print(f"Uploading Parquet files to MinIO bucket '{MINIO_BUCKET}'...")
for f in files:
    s3_target = f"{MINIO_BUCKET}/uploads/{f.name}"
    s3.put(str(f), s3_target)
    print(f"Uploaded {f.name} -> s3://{s3_target}")

print(f"\nMinIO {MINIO_BUCKET}/uploads contents:")
for item in s3.ls(f"{MINIO_BUCKET}/uploads"):
    info = s3.info(item)
    print(f" - s3://{item} ({info.get('size', 0):,} bytes)")

print("\nUpload completed successfully!")
