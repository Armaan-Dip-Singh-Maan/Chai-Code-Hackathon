import { Router } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { bookSeatLegacy, getAllSeatsLegacy } from "../services/booking.service.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(__dirname));

export const legacyRouter = Router();

legacyRouter.get("/", (req, res) => {
  res.sendFile(`${rootDir}/index.html`);
});

legacyRouter.get("/seats", async (req, res) => {
  const seats = await getAllSeatsLegacy();
  res.send(seats);
});

legacyRouter.put("/:id/:name", async (req, res) => {
  try {
    const seatId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(seatId)) {
      return res.status(400).json({ error: "Seat id must be a number" });
    }
    const result = await bookSeatLegacy({ seatId, name: req.params.name });
    if (result.error) {
      return res.status(409).json(result);
    }
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
