import jwt from "jsonwebtoken";
import { config } from "../config/env.mjs";

export const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const verifyAccessToken = (token) => jwt.verify(token, config.jwtSecret);
