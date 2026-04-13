import { config } from "../config/env.mjs";
import { cleanupExpiredHolds } from "../services/booking.service.mjs";

let intervalRef;

export const startHoldCleanupJob = () => {
  if (intervalRef) {
    return;
  }
  intervalRef = setInterval(async () => {
    try {
      await cleanupExpiredHolds();
    } catch (error) {
      console.error("Seat hold cleanup failed", error.message);
    }
  }, config.holdCleanupIntervalMs);
};
