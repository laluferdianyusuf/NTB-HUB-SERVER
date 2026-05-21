import { Request, Response } from "express";
import {
  CommunityRepository,
  EventRepository,
  PublicPlaceRepository,
  UserRepository,
  VenueRepository,
} from "repositories";
import { TrackingService } from "services";
import { DeepLinkDataService } from "services/deepLink.services";

const ALLOWED_TYPES = [
  "user",
  "venue",
  "event",
  "verify-email",
  "reset-password",
  "invite",
];

const deepLinkService = new DeepLinkDataService(
  new UserRepository(),
  new VenueRepository(),
  new EventRepository(),
  new CommunityRepository(),
  new PublicPlaceRepository(),
);

export class DeepLinkController {
  static async handle(req: Request, res: Response) {
    const { type, id } = req.params;
    const ref = req.query.ref as string;

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(404).send("Not found");
    }

    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip;

    TrackingService.trackClick({
      type,
      id,
      ref,
      userAgent,
      ip,
    });

    const data = await deepLinkService.resolve(type, id);

    const safe = data ?? {
      title: "Content",
      description: "Check this content",
      image: "https://via.placeholder.com/300",
    };

    const query = new URLSearchParams(req.query as any).toString();

    const appLink = `https://app.ntbhub.com/${type}/${id}`;
    const deepLink = `ntbhub-apps://${type}/${id}`;

    const playStore =
      "https://play.google.com/store/apps/details?id=com.ntbhub.app";

    return res.send(`
<html>
  <head>
    <meta property="og:title" content="${safe.title}" />
    <meta property="og:description" content="${safe.description}" />
    <meta property="og:image" content="${safe.image}" />

    <!-- UNIVERSAL LINK FIRST -->
    <meta http-equiv="refresh" content="0; url=${appLink}" />

    <script>
      // fallback ke app scheme
      setTimeout(() => {
        window.location.href = "${deepLink}";
      }, 500);

      // fallback store kalau app tidak ada
      setTimeout(() => {
        window.location.href = "${playStore}";
      }, 2500);
    </script>
  </head>

  <body style="text-align:center; padding:40px;">
    <h2>${safe.title}</h2>
    <p>${safe.description}</p>

    <a href="${appLink}">Open App</a><br/><br/>
    <a href="${playStore}">Download App</a>
  </body>
</html>
`);
  }
}
