import { redisCache } from "config/redis.config";
import { MapsRepository } from "repositories";

const CACHE_TTL = 60 * 5;

export class MapsService {
  private readonly repo: MapsRepository;

  constructor() {
    this.repo = new MapsRepository(process.env.GOOGLE_MAPS_API_KEY as string);
  }

  async autocomplete(
    input: string,
    allowedTypes: string[] = ["geocode", "locality", "airport"],
  ) {
    if (!input || input.length < 3) return [];

    const cacheKey = `auto:${input}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const { data } = await this.repo.autocomplete(input);

    if (data.status !== "OK" || !data.predictions) return [];

    const filtered = data.predictions.filter((p) =>
      p.types.some((t) => allowedTypes.includes(t)),
    );

    const slim = filtered.map((p) => {
      const mainText = p.structured_formatting.main_text;
      const secondaryText = p.structured_formatting.secondary_text;

      const highlighted = mainText.replace(
        new RegExp(input, "gi"),
        (match) => `${match}`,
      );

      return {
        id: p.place_id,
        title: highlighted,
        subtitle: secondaryText,
        types: p.types,
      };
    });

    await redisCache.setex(
      cacheKey,
      CACHE_TTL,
      JSON.stringify(data.predictions),
    );
    return data.predictions;
  }

  async placeDetails(placeId: string) {
    if (!placeId) return null;

    const cacheKey = `place:${placeId}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const { data } = await this.repo.placeDetails(placeId);

      if (!data.result) return null;

      const r = data.result;
      console.log(r);

      const slim = {
        id: r.place_id,
        name: r.name,
        address: r.formatted_address,
        latitude: r.geometry.location.lat,
        longitude: r.geometry.location.lng,
        types: r.types || [],
      };

      await redisCache.setex(cacheKey, CACHE_TTL, JSON.stringify(slim));
      return slim;
    } catch (err) {
      console.error("Maps placeDetails error:", err);
      return null;
    }
  }

  async directions(
    origin: string,
    destination: string,
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
  ) {
    if (!origin || !destination) return null;

    const cacheKey = `dir:${origin}:${destination}:${mode}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const { data } = await this.repo.directions(origin, destination, mode);

    if (!data.routes || !data.routes.length) return null;

    const leg = data.routes[0].legs[0];

    const slim = {
      distanceKm: leg.distance.value / 1000,
      durationMin: Math.ceil(leg.duration.value / 60),
      steps: leg.steps.map((s) => ({
        instruction: s.html_instructions.replace(/<[^>]+>/g, ""),
        lat: s.start_location.lat,
        lng: s.start_location.lng,
      })),
      polyline: data.routes[0].overview_polyline.points,
    };

    await redisCache.setex(cacheKey, CACHE_TTL, JSON.stringify(slim));
    return slim;
  }
}
