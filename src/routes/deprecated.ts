import { Router } from "express";

export const deprecatedRouters = Router();

for (let version = 2; version <= 17; version++) {
  deprecatedRouters.use(`/api/v${version}`, (req, res) => {
    const newPath = `/api/v1${req.path}`;

    res.set("X-API-Deprecated", "true");
    res.redirect(307, newPath);
  });
}
