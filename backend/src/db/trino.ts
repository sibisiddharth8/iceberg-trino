import { BasicAuth, Trino } from "@trinodb/trino-js-client";

export const trino = Trino.create({
  server: process.env.TRINO_URL ?? "http://localhost:8080",
  catalog: process.env.TRINO_CATALOG ?? "iceberg",
  schema: process.env.TRINO_SCHEMA ?? "banking",
  auth: new BasicAuth(process.env.TRINO_USER ?? "finance-app"),
});