import { z } from "zod";

export const movieParamSchema = z.object({
  movieId: z.string().trim().min(1).max(80),
});

export const seatParamSchema = z.object({
  movieId: z.string().trim().min(1).max(80),
  seatId: z.coerce.number().int().positive(),
});
