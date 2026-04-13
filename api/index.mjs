import app from "../src/app.mjs";
import { ensureSchema } from "../src/services/schema.service.mjs";
let schemaInitialized = false;

const initSchemaIfNeeded = async () => {
  if (schemaInitialized) {
    return;
  }
  try {
    await ensureSchema();
    schemaInitialized = true;
  } catch (error) {
    // Keep app alive even when DB is unavailable in deployment.
    // /health and DB-backed routes will report DB issues explicitly.
    console.error("Schema initialization skipped:", error.message);
  }
};

export default async function handler(req, res) {
  await initSchemaIfNeeded();
  return app(req, res);
}
