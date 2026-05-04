import { Request, Response } from "express";

export class WellKnownController {
  static assetLinks(req: Request, res: Response) {
    res.setHeader("Content-Type", "application/json");

    return res.json([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: process.env.PACKAGE_NAME,
          sha256_cert_fingerprints: [process.env.SHA256],
        },
      },
    ]);
  }

  static appleAppSite(req: Request, res: Response) {
    res.setHeader("Content-Type", "application/json");

    return res.send({
      applinks: {
        details: [
          {
            appID: "TEAMID.com.yourapp.mobile",
            paths: ["/*"],
          },
        ],
      },
    });
  }
}
