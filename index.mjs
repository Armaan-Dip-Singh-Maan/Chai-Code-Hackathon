import { createApp } from "./src/app.mjs";
import { config } from "./src/config/env.mjs";
import { startHoldCleanupJob } from "./src/jobs/hold-cleanup.job.mjs";
import { ensureSchema } from "./src/services/schema.service.mjs";

const boot = async () => {
  await ensureSchema();

  const app = createApp();
  startHoldCleanupJob();

  app.listen(config.port, () =>
    console.log(`Server starting on port: ${config.port}`)
  );
};

boot().catch((error) => {
  console.error("Failed to boot app", error);
  process.exit(1);
});
