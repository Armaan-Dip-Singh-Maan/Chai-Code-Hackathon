import { pool } from "../config/db.mjs";
import { config } from "../config/env.mjs";
import { AppError } from "./errors.mjs";

const BOOKED_STATUS = "booked";
const ACTIVE_STATUS = "active";
const EXPIRED_STATUS = "expired";
const CANCELED_STATUS = "canceled";

export const getAllSeatsLegacy = async () => {
  const result = await pool.query("SELECT * FROM seats ORDER BY id ASC");
  return result.rows;
};

export const bookSeatLegacy = async ({ seatId, name }) => {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");
    const seatResult = await conn.query(
      "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE",
      [seatId]
    );

    if (seatResult.rowCount === 0) {
      await conn.query("ROLLBACK");
      return { error: "Seat already booked" };
    }

    const updateResult = await conn.query(
      "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1",
      [seatId, name]
    );
    await conn.query("COMMIT");
    return updateResult;
  } catch (error) {
    await conn.query("ROLLBACK");
    throw error;
  } finally {
    conn.release();
  }
};

export const listMovieSeats = async ({ movieId, userId }) => {
  const result = await pool.query(
    `
      SELECT
        s.id,
        s.name AS legacy_name,
        s.isbooked AS legacy_isbooked,
        b.user_id AS booked_by_user_id,
        b.status AS booking_status,
        u.name AS booked_by_name,
        h.user_id AS held_by_user_id,
        h.expires_at AS hold_expires_at
      FROM seats s
      LEFT JOIN bookings b
        ON b.seat_id = s.id
       AND b.movie_id = $1
       AND b.status = $2
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN seat_holds h
        ON h.seat_id = s.id
       AND h.movie_id = $1
       AND h.status = $3
       AND h.expires_at > NOW()
      ORDER BY s.id ASC
    `,
    [movieId, BOOKED_STATUS, ACTIVE_STATUS]
  );

  return result.rows.map((row) => {
    const isBooked = row.booking_status === BOOKED_STATUS || row.legacy_isbooked === 1;
    const isHeld = !isBooked && Boolean(row.held_by_user_id);
    const bookedBy = row.booked_by_name || row.legacy_name || "Booked";
    return {
      id: row.id,
      state: isBooked ? "booked" : isHeld ? "held" : "available",
      bookedBy: isBooked ? bookedBy : null,
      isMine: row.booked_by_user_id === userId || row.held_by_user_id === userId,
      holdExpiresAt: row.hold_expires_at,
    };
  });
};

export const holdSeat = async ({ movieId, seatId, userId }) => {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");
    await conn.query("SELECT id FROM seats WHERE id = $1 FOR UPDATE", [seatId]);

    const booked = await conn.query(
      "SELECT id FROM bookings WHERE seat_id = $1 AND movie_id = $2 AND status = $3 FOR UPDATE",
      [seatId, movieId, BOOKED_STATUS]
    );
    if (booked.rowCount > 0) {
      throw new AppError(409, "Seat already booked", "seat_taken");
    }

    await conn.query(
      "UPDATE seat_holds SET status = $3 WHERE seat_id = $1 AND movie_id = $2 AND status = $4 AND expires_at <= NOW()",
      [seatId, movieId, EXPIRED_STATUS, ACTIVE_STATUS]
    );

    const activeHold = await conn.query(
      "SELECT id, user_id, expires_at FROM seat_holds WHERE seat_id = $1 AND movie_id = $2 AND status = $3 AND expires_at > NOW() FOR UPDATE",
      [seatId, movieId, ACTIVE_STATUS]
    );

    if (activeHold.rowCount > 0 && activeHold.rows[0].user_id !== userId) {
      throw new AppError(409, "Seat is currently held by another user", "seat_held");
    }

    const hold = await conn.query(
      `
        INSERT INTO seat_holds (seat_id, movie_id, user_id, status, expires_at)
        VALUES ($1, $2, $3, $4, NOW() + ($5 * interval '1 second'))
        ON CONFLICT (seat_id, movie_id, status)
        WHERE status = 'active'
        DO UPDATE SET
          user_id = EXCLUDED.user_id,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()
        RETURNING id, seat_id, movie_id, user_id, status, expires_at
      `,
      [seatId, movieId, userId, ACTIVE_STATUS, config.holdDurationSeconds]
    );

    await conn.query("COMMIT");
    return hold.rows[0];
  } catch (error) {
    await conn.query("ROLLBACK");
    throw error;
  } finally {
    conn.release();
  }
};

export const confirmSeatBooking = async ({ movieId, seatId, userId }) => {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");
    await conn.query("SELECT id FROM seats WHERE id = $1 FOR UPDATE", [seatId]);

    const alreadyBooked = await conn.query(
      "SELECT id FROM bookings WHERE seat_id = $1 AND movie_id = $2 AND status = $3 FOR UPDATE",
      [seatId, movieId, BOOKED_STATUS]
    );
    if (alreadyBooked.rowCount > 0) {
      throw new AppError(409, "Seat already booked", "seat_taken");
    }

    const holdResult = await conn.query(
      "SELECT id, expires_at FROM seat_holds WHERE seat_id = $1 AND movie_id = $2 AND user_id = $3 AND status = $4 FOR UPDATE",
      [seatId, movieId, userId, ACTIVE_STATUS]
    );
    if (holdResult.rowCount === 0) {
      throw new AppError(404, "Active hold not found for this user", "hold_not_found");
    }

    const hold = holdResult.rows[0];
    if (new Date(hold.expires_at).getTime() <= Date.now()) {
      await conn.query("UPDATE seat_holds SET status = $2 WHERE id = $1", [
        hold.id,
        EXPIRED_STATUS,
      ]);
      throw new AppError(410, "Seat hold expired", "hold_expired");
    }

    const bookingResult = await conn.query(
      `
        INSERT INTO bookings (seat_id, movie_id, user_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, seat_id, movie_id, user_id, status, created_at
      `,
      [seatId, movieId, userId, BOOKED_STATUS]
    );

    const user = await conn.query("SELECT name FROM users WHERE id = $1", [userId]);
    const bookerName = user.rows[0]?.name || "User";

    await conn.query("UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1", [
      seatId,
      bookerName,
    ]);
    await conn.query("UPDATE seat_holds SET status = $2 WHERE id = $1", [
      hold.id,
      CANCELED_STATUS,
    ]);

    await conn.query("COMMIT");
    return bookingResult.rows[0];
  } catch (error) {
    await conn.query("ROLLBACK");
    throw error;
  } finally {
    conn.release();
  }
};

export const listUserBookings = async ({ userId }) => {
  const result = await pool.query(
    `
      SELECT
        b.id,
        b.movie_id AS "movieId",
        b.seat_id AS "seatId",
        b.status,
        b.created_at AS "createdAt"
      FROM bookings b
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `,
    [userId]
  );
  return result.rows;
};

export const cancelSeatBooking = async ({ movieId, seatId, userId }) => {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");
    await conn.query("SELECT id FROM seats WHERE id = $1 FOR UPDATE", [seatId]);

    const bookingResult = await conn.query(
      `
        SELECT id
        FROM bookings
        WHERE seat_id = $1
          AND movie_id = $2
          AND user_id = $3
          AND status = $4
        FOR UPDATE
      `,
      [seatId, movieId, userId, BOOKED_STATUS]
    );

    if (bookingResult.rowCount === 0) {
      throw new AppError(
        404,
        "No active booking found for this user and seat",
        "booking_not_found"
      );
    }

    await conn.query(
      "UPDATE bookings SET status = $2, updated_at = NOW() WHERE id = $1",
      [bookingResult.rows[0].id, CANCELED_STATUS]
    );

    await conn.query("UPDATE seats SET isbooked = 0, name = NULL WHERE id = $1", [
      seatId,
    ]);

    await conn.query("COMMIT");
  } catch (error) {
    await conn.query("ROLLBACK");
    throw error;
  } finally {
    conn.release();
  }
};

export const releaseSeatHold = async ({ movieId, seatId, userId }) => {
  const result = await pool.query(
    "UPDATE seat_holds SET status = $4 WHERE seat_id = $1 AND movie_id = $2 AND user_id = $3 AND status = $5",
    [seatId, movieId, userId, CANCELED_STATUS, ACTIVE_STATUS]
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "No active hold found to release", "hold_not_found");
  }
};

export const resetAllBookings = async () => {
  await pool.query("DELETE FROM bookings");
  await pool.query("DELETE FROM seat_holds");
  await pool.query("UPDATE seats SET isbooked = 0, name = NULL");
};

export const cleanupExpiredHolds = async () => {
  const result = await pool.query(
    "UPDATE seat_holds SET status = $1 WHERE status = $2 AND expires_at <= NOW()",
    [EXPIRED_STATUS, ACTIVE_STATUS]
  );
  return result.rowCount;
};
