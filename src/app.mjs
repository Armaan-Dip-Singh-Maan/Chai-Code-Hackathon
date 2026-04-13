import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.routes.mjs";
import { legacyRouter } from "./routes/legacy.routes.mjs";
import { seatRouter } from "./routes/seat.routes.mjs";
import { adminRouter } from "./routes/admin.routes.mjs";
import { errorHandler } from "./middleware/error.middleware.mjs";
import { pool } from "./config/db.mjs";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

export const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      return res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        db: "connected",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return res.status(503).json({
        status: "error",
        db: "disconnected",
        reason: err.message,
      });
    }
  });

  app.use("/auth", authLimiter, authRouter);
  app.use("/admin", adminRouter);
  app.use("/", seatRouter);
  app.use("/", legacyRouter);

  app.use(errorHandler);

  return app;
};

const app = createApp();
export default app;
