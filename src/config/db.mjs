import pg from "pg";
import { config } from "./env.mjs";

const forceSslFromUrl =
  typeof config.db.connectionString === "string" &&
  config.db.connectionString.includes("sslmode=require");

const sslConfig =
  config.db.ssl || forceSslFromUrl ? { rejectUnauthorized: false } : undefined;

const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      max: config.db.max,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      ssl: sslConfig,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      max: config.db.max,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      ssl: sslConfig,
    };

export const pool = new pg.Pool(poolConfig);
