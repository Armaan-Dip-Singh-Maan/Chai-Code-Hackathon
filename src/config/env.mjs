import dotenv from "dotenv";

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config = {
  port: toInt(process.env.PORT, 8080),
  jwtSecret: process.env.JWT_SECRET || "hackathon_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  holdDurationSeconds: toInt(process.env.HOLD_DURATION_SECONDS, 120),
  holdCleanupIntervalMs: toInt(process.env.HOLD_CLEANUP_INTERVAL_MS, 30000),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: toInt(process.env.DB_PORT, 5433),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "sql_class_2_db",
    max: toInt(process.env.DB_MAX_CONNECTIONS, 20),
    connectionTimeoutMillis: toInt(process.env.DB_CONNECTION_TIMEOUT_MS, 0),
    idleTimeoutMillis: toInt(process.env.DB_IDLE_TIMEOUT_MS, 0),
  },
};
