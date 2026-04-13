import { Router } from "express";
import {
  getUserById,
  loginUser,
  registerUser,
} from "../services/auth.service.mjs";
import { AppError } from "../services/errors.mjs";
import { loginSchema, registerSchema } from "../validation/auth.validation.mjs";
import { requireAuth } from "../middleware/auth.middleware.mjs";
import { asyncHandler } from "../middleware/error.middleware.mjs";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return res.status(201).json(result);
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return res.status(200).json(result);
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user.userId);
    if (!user) {
      throw new AppError(404, "User not found", "user_not_found");
    }
    return res.status(200).json({ user });
  })
);
