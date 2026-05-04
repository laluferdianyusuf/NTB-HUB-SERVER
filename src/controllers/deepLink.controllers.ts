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
import { isMobile } from "../utils/device";

const ALLOWED_TYPES = ["user", "venue", "event"];

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

    const deepLink = `ntbhub-apps://${type}/${id}`;
    const playStore =
      "https://play.google.com/store/apps/details?id=com.laluferdian.ntbhubapps";

    return res.send(`
      <html>
        <head>
          <title>${safe.title}</title>

          <!-- Open Graph -->
          <meta property="og:title" content="${safe.title}" />
          <meta property="og:description" content="${safe.description}" />
          <meta property="og:image" content="${safe.image}" />
          <meta property="og:url" content="${process.env.APP_DOMAIN}/${type}/${id}" />
          <meta property="og:type" content="website" />

          <!-- Redirect -->
          ${
            isMobile(userAgent)
              ? `<meta http-equiv="refresh" content="0; url=${deepLink}" />`
              : ""
          }

          <script>
            setTimeout(() => {
              window.location.href = "${playStore}";
            }, 2000);
          </script>
        </head>

        <body style="font-family:sans-serif; text-align:center; padding:40px;">
          <h2>${safe.title}</h2>
          <img src="${safe.image}" width="200" />
          <p>${safe.description}</p>

          <a href="${deepLink}">Open App</a><br/><br/>
          <a href="${playStore}">Download App</a>
        </body>
      </html>
    `);
  }
}
