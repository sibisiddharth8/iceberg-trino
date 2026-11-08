import "dotenv/config";

export const config = {
  // Server
  port: Number(process.env.PORT ?? 3001),

  // Trino Engine
  trino: {
    url: process.env.TRINO_URL ?? "http://localhost:8080",
    user: process.env.TRINO_USER ?? "finance-app",
    catalog: process.env.TRINO_CATALOG ?? "iceberg",
    schema: process.env.TRINO_SCHEMA ?? "banking",
  },

  // MinIO / S3 Object Storage
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
    bucket: process.env.MINIO_BUCKET ?? "finance-lake",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "minioadmin",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "minioadmin123",
    region: process.env.AWS_REGION ?? "us-east-1",
  },

  // Apache Iceberg Catalog
  iceberg: {
    restUri: process.env.ICEBERG_REST_URI ?? "http://localhost:8181",
    warehouse: process.env.ICEBERG_WAREHOUSE ?? "s3://finance-lake/warehouse/",
    catalogName: process.env.ICEBERG_CATALOG_NAME ?? "finance",
    defaultNamespace: process.env.DEFAULT_NAMESPACE ?? "banking",
  },

  // Python Engine Path
  pythonPath: process.env.PYTHON_PATH,
};

