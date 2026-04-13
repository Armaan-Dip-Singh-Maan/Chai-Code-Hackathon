import dotenv from "dotenv";

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toTrimmed = (value, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const config = {
  port: toInt(process.env.PORT, 8080),
  jwtSecret: toTrimmed(process.env.JWT_SECRET, "hackathon_secret_change_me"),
  jwtExpiresIn: toTrimmed(process.env.JWT_EXPIRES_IN, "2h"),
  holdDurationSeconds: toInt(process.env.HOLD_DURATION_SECONDS, 120),
  holdCleanupIntervalMs: toInt(process.env.HOLD_CLEANUP_INTERVAL_MS, 30000),
  db: {
    connectionString: toTrimmed(process.env.DATABASE_URL, ""),
    host: toTrimmed(process.env.DB_HOST, "localhost"),
    port: toInt(process.env.DB_PORT, 5433),
    user: toTrimmed(process.env.DB_USER, "postgres"),
    password: toTrimmed(process.env.DB_PASSWORD, "postgres"),
    database: toTrimmed(process.env.DB_NAME, "sql_class_2_db"),
    max: toInt(process.env.DB_MAX_CONNECTIONS, 20),
    connectionTimeoutMillis: toInt(process.env.DB_CONNECTION_TIMEOUT_MS, 0),
    idleTimeoutMillis: toInt(process.env.DB_IDLE_TIMEOUT_MS, 0),
    ssl: (process.env.DB_SSL || "false").toLowerCase() === "true",
  },
};
