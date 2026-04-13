import bcrypt from "bcryptjs";
import { pool } from "../config/db.mjs";
import { signAccessToken } from "../utils/jwt.mjs";
import { AppError } from "./errors.mjs";

const sanitizeUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
});

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    normalizedEmail,
  ]);
  if (existing.rowCount > 0) {
    throw new AppError(409, "Email is already registered", "email_exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const insertResult = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
    [name.trim(), normalizedEmail, passwordHash]
  );
  const user = sanitizeUser(insertResult.rows[0]);
  const token = signAccessToken({ userId: user.id, email: user.email });
  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [normalizedEmail]
  );
  if (result.rowCount === 0) {
    throw new AppError(401, "Invalid email or password", "invalid_credentials");
  }

  const userRow = result.rows[0];
  const isValid = await bcrypt.compare(password, userRow.password_hash);
  if (!isValid) {
    throw new AppError(401, "Invalid email or password", "invalid_credentials");
  }

  const user = sanitizeUser(userRow);
  const token = signAccessToken({ userId: user.id, email: user.email });
  return { user, token };
};

export const getUserById = async (id) => {
  const result = await pool.query(
    "SELECT id, name, email FROM users WHERE id = $1 LIMIT 1",
    [id]
  );
  return result.rows[0] ?? null;
};
