import { Request, Response } from "express";
import { MapsService } from "../services";

const service = new MapsService();

export class MapsController {
  static async autocomplete(req: Request, res: Response) {
    try {
      const input = (req.query.input as string)?.trim();

      if (!input || input.length < 3) {
        return res.status(400).json({ message: "Input minimal 3 karakter" });
      }

      const typesQuery = req.query.types as string;
      const allowedTypes = typesQuery
        ? typesQuery.split(",").map((t) => t.trim())
        : ["geocode", "locality", "airport"];

      const result = await service.autocomplete(input, allowedTypes);

      return res.json({ data: result });
    } catch (err) {
      console.error("Maps autocomplete error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async placeDetails(req: Request, res: Response) {
    try {
      const placeId = req.params.placeId?.trim();

      if (!placeId) {
        return res.status(400).json({ message: "placeId wajib diisi" });
      }

      const result = await service.placeDetails(placeId);

      if (!result) {
        return res.status(404).json({ message: "Place tidak ditemukan" });
      }

      return res.json({ data: result });
    } catch (err) {
      console.error("Maps placeDetails error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async directions(req: Request, res: Response) {
    try {
      const { origin, destination, mode } = req.query;

      if (!origin || !destination) {
        return res
          .status(400)
          .json({ message: "origin dan destination wajib diisi" });
      }

      const allowedModes = ["driving", "walking", "bicycling", "transit"];
      const travelMode = allowedModes.includes(mode as string)
        ? mode
        : "driving";

      const result = await service.directions(
        origin as string,
        destination as string,
        travelMode as any,
      );

      if (!result)
        return res.status(404).json({ message: "Route tidak ditemukan" });

      return res.json({ data: result });
    } catch (err) {
      console.error("Maps directions error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
