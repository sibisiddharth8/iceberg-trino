import { BasicAuth, Trino } from "@trinodb/trino-js-client";
import { config } from "../config/env.js";

export const trino = Trino.create({
  server: config.trino.url,
  catalog: config.trino.catalog,
  schema: config.trino.schema,
  auth: new BasicAuth(config.trino.user),
});
