import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.mjs";
import { asyncHandler } from "../middleware/error.middleware.mjs";
import {
  confirmSeatBooking,
  holdSeat,
  listMovieSeats,
  listUserBookings,
  releaseSeatHold,
} from "../services/booking.service.mjs";
import {
  movieParamSchema,
  seatParamSchema,
} from "../validation/booking.validation.mjs";

export const seatRouter = Router();

seatRouter.get(
  "/movies/:movieId/seats",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { movieId } = movieParamSchema.parse(req.params);
    const seats = await listMovieSeats({ movieId, userId: req.user.userId });
    return res.status(200).json({ movieId, seats });
  })
);

seatRouter.post(
  "/movies/:movieId/seats/:seatId/hold",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { movieId, seatId } = seatParamSchema.parse(req.params);
    const hold = await holdSeat({ movieId, seatId, userId: req.user.userId });
    return res.status(200).json({ hold });
  })
);

seatRouter.delete(
  "/movies/:movieId/seats/:seatId/hold",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { movieId, seatId } = seatParamSchema.parse(req.params);
    await releaseSeatHold({ movieId, seatId, userId: req.user.userId });
    return res.status(200).json({ message: "Hold released" });
  })
);

seatRouter.post(
  "/movies/:movieId/seats/:seatId/confirm",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { movieId, seatId } = seatParamSchema.parse(req.params);
    const booking = await confirmSeatBooking({
      movieId,
      seatId,
      userId: req.user.userId,
    });
    return res.status(200).json({ booking });
  })
);

seatRouter.get(
  "/me/bookings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookings = await listUserBookings({ userId: req.user.userId });
    return res.status(200).json({ bookings });
  })
);
