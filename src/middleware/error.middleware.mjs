import { ZodError } from "zod";
import { AppError } from "../services/errors.mjs";

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.issues });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
};
