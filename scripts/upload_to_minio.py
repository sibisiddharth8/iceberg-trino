import s3fs
from pathlib import Path

s3 = s3fs.S3FileSystem(
    key="minioadmin",
    secret="minioadmin123",
    client_kwargs={"endpoint_url": "http://localhost:9000"}
)

# Ensure bucket exists
if not s3.exists("finance-lake"):
    s3.mkdir("finance-lake")

local_dir = Path("data/parquet")
files = sorted(list(local_dir.glob("*.parquet")))

print("Uploading Parquet files to MinIO...")
for f in files:
    s3_target = f"finance-lake/uploads/{f.name}"
    s3.put(str(f), s3_target)
    print(f"Uploaded {f.name} -> s3://{s3_target}")

print("\nMinIO finance-lake/uploads contents:")
for item in s3.ls("finance-lake/uploads"):
    info = s3.info(item)
    print(f" - s3://{item} ({info.get('size', 0):,} bytes)")

print("\nUpload completed successfully!")

