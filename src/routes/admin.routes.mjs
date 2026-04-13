import { Router } from "express";
import { asyncHandler } from "../middleware/error.middleware.mjs";
import { resetAllBookings } from "../services/booking.service.mjs";
import { pool } from "../config/db.mjs";

export const adminRouter = Router();

adminRouter.post(
  "/reset",
  asyncHandler(async (_req, res) => {
    await resetAllBookings();
    return res.status(200).json({ message: "All bookings, holds, and seats have been reset" });
  })
);

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const users = await pool.query("SELECT COUNT(*) AS count FROM users");
    const bookings = await pool.query("SELECT COUNT(*) AS count FROM bookings WHERE status = 'booked'");
    const activeHolds = await pool.query("SELECT COUNT(*) AS count FROM seat_holds WHERE status = 'active' AND expires_at > NOW()");
    const availableSeats = await pool.query("SELECT COUNT(*) AS count FROM seats WHERE isbooked = 0");
    return res.status(200).json({
      users: Number(users.rows[0].count),
      bookings: Number(bookings.rows[0].count),
      activeHolds: Number(activeHolds.rows[0].count),
      availableSeats: Number(availableSeats.rows[0].count),
    });
  })
);
