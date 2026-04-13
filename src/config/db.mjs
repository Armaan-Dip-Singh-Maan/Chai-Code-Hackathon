import pg from "pg";
import { config } from "./env.mjs";

export const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: config.db.max,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
});
