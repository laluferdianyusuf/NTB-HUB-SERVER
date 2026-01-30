import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { Role } from "@prisma/client";
import {
  UserRepository,
  VenueRepository,
  UserRoleRepository,
} from "repositories";

const redis = new Redis();

const userRepository = new UserRepository();
const venueRepository = new VenueRepository();
const userRoleRepository = new UserRoleRepository();

export class AuthMiddlewares {
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Missing token",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as {
        sub: string;
      };

      const blacklisted = await redis.get(`blacklist:${token}`);
      if (blacklisted) {
        return res.status(401).json({
          status: false,
          message: "Token revoked",
        });
      }

      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        return res.status(401).json({
          status: false,
          message: "User not found",
        });
      }

      (req as any).user = user;
      (req as any).token = token;

      next();
    } catch (err: any) {
      return res.status(401).json({
        status: false,
        message:
          err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
        isExpired: err.name === "TokenExpiredError",
      });
    }
  };

  authorizeGlobalRole =
    (roles: Role[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;

      const hasRole = await userRoleRepository.hasRole({
        userId: user.id,
        role: { in: roles } as any,
      });

      if (!hasRole) {
        return res.status(403).json({
          status: false,
          message: "Forbidden: insufficient global role",
        });
      }

      next();
    };

  authorizeVenueRole =
    (roles: Role[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      const venueId =
        req.params.venueId || req.body.venueId || req.query.venueId;

      if (!venueId) {
        return res.status(400).json({
          status: false,
          message: "Missing venueId",
        });
      }

      const venue = await venueRepository.findVenueById(venueId);
      if (!venue) {
        return res.status(404).json({
          status: false,
          message: "Venue not found",
        });
      }

      const hasRole = await userRoleRepository.hasRole({
        userId: user.id,
        role: { in: roles } as any,
        venueId,
      });

      if (!hasRole) {
        return res.status(403).json({
          status: false,
          message: "Forbidden: insufficient venue role",
        });
      }

      (req as any).venue = venue;

      next();
    };

  authorizeEventRole =
    (roles: Role[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      const eventId =
        req.params.eventId || req.body.eventId || req.query.eventId;

      if (!eventId) {
        return res.status(400).json({
          status: false,
          message: "Missing eventId",
        });
      }

      const hasRole = await userRoleRepository.hasRole({
        userId: user.id,
        role: { in: roles } as any,
        eventId,
      });

      if (!hasRole) {
        return res.status(403).json({
          status: false,
          message: "Forbidden: insufficient event role",
        });
      }

      next();
    };
}
