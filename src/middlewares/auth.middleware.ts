import { NextFunction, Request, Response } from "express";
import { UserRepository, VenueRepository } from "repositories";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
const redis = new Redis();

const userRepository = new UserRepository();
const venueRepository = new VenueRepository();

export class AuthMiddlewares {
  async authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: false,
        status_code: 401,
        message: "Unauthorized: Missing or invalid token",
      });
    }

    const token = authHeader.split(" ")[1];
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) {
      return res.status(403).json({
        status: false,
        status_code: 403,
        message: "Token has been revoked",
      });
    }
    try {
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_SECRET as string,
      ) as any;

      const user = await userRepository.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          status: false,
          status_code: 401,
          message: "Unauthorized: User not found",
        });
      }

      (req as any).user = user;

      next();
    } catch (error) {
      console.error("Auth error:", error);

      const isExpired = error instanceof jwt.TokenExpiredError;
      return res.status(401).json({
        status: false,
        status_code: 401,
        message: isExpired
          ? "Unauthorized: Token expired. Please refresh."
          : "Unauthorized: Invalid token.",
        isExpired: isExpired,
      });
    }
  }

  async isAdmin(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        status: false,
        status_code: 403,
        message: "Forbidden: Admin access only",
      });
    }

    next();
  }

  async logout(req: Request, res: Response) {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.decode(token) as any;

    if (!decoded?.exp || !decoded?.id) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    await redis.setex(`blacklist:${token}`, ttl, "true");

    await redis.del(`refresh:${decoded.id}`);

    return res.json({
      status: true,
      status_code: 200,
      message: "Logged out successfully",
    });
  }

  async venueAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const blacklisted = await redis.get(`blacklist:venue:${token}`);

    if (blacklisted) {
      return res.status(403).json({
        status: false,
        status_code: 403,
        message: "Token has been revoked",
      });
    }

    try {
      const decode = jwt.verify(
        token,
        process.env.ACCESS_SECRET as string,
      ) as any;

      const venue = await venueRepository.findVenueById(decode.venueId);

      if (!venue) {
        return res.status(401).json({
          status: false,
          status_code: 401,
          message: "Unauthorized: Venue not found",
        });
      }

      (req as any).venue = venue;
      next();
    } catch (error: any) {
      console.error("Venue Auth error:", error);

      const isExpired = error.name === "TokenExpiredError";

      return res.status(401).json({
        status: false,
        status_code: 401,
        message: isExpired
          ? "Unauthorized: Token expired. Please refresh."
          : "Unauthorized or invalid token",
        isExpired: isExpired,
      });
    }
  }
  async logoutVenue(req: Request, res: Response) {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.decode(token) as any;

    if (!decoded?.exp || !decoded?.venueId) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    await redis.setex(`blacklist:venue:${token}`, ttl, "true");

    await redis.del(`venue:refresh:${decoded.venueId}`);

    return res.json({
      status: true,
      status_code: 200,
      message: "Logged out successfully",
    });
  }

  authorize(
    roles: (
      | "CUSTOMER"
      | "ADMIN"
      | "VENUE"
      | "COURIER"
      | "VENUE_OWNER"
      | "VENUE_STAFF"
      | "EVENT_OWNER"
    )[],
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
          status: false,
          status_code: 401,
          message: "Unauthorized: Missing token",
        });
      }

      const token = authHeader.split(" ")[1];

      // cek blacklist token
      try {
        // decode token first
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET!) as any;

        // check token blacklist based on role in JWT
        const roleInToken = String(
          decoded.role || (decoded.venueId ? "VENUE" : "CUSTOMER"),
        ) as "CUSTOMER" | "ADMIN" | "VENUE";

        const blacklistKey =
          roleInToken === "VENUE"
            ? `blacklist:venue:${token}`
            : `blacklist:${token}`;

        const blacklisted = await redis.get(blacklistKey);
        if (blacklisted) {
          return res.status(403).json({
            status: false,
            status_code: 403,
            message: "Token has been revoked",
          });
        }
        const normalizedRole = roleInToken.toUpperCase() as
          | "CUSTOMER"
          | "ADMIN"
          | "VENUE";

        // check if role allowed
        if (!roles.includes(normalizedRole)) {
          return res.status(403).json({
            status: false,
            status_code: 403,
            message: "Forbidden: Insufficient role",
          });
        }

        // attach entity to request
        if (roleInToken === "VENUE") {
          const venue = await venueRepository.findVenueById(decoded.venueId);
          if (!venue) {
            return res.status(404).json({
              status: false,
              status_code: 404,
              message: "Venue not found",
            });
          }
          (req as any).venue = venue;
        } else {
          const user = await userRepository.findById(decoded.id);
          if (!user) {
            return res.status(404).json({
              status: false,
              status_code: 404,
              message: "User not found",
            });
          }
          (req as any).user = user;
        }

        next();
      } catch (error: any) {
        // console.error("Auth error:", error);
        const isExpired = error.name === "TokenExpiredError";
        return res.status(401).json({
          status: false,
          status_code: 401,
          message: isExpired
            ? "Token expired. Please refresh."
            : "Unauthorized: Invalid token",
          isExpired,
        });
      }
    };
  }

  //   authorize(
  //   roles: (
  //     | "CUSTOMER"
  //     | "ADMIN"
  //     | "VENUE"
  //     | "COURIER"
  //     | "VENUE_OWNER"
  //     | "VENUE_STAFF"
  //     | "EVENT_OWNER"
  //   )[],
  // ) {
  //   return async (req: Request, res: Response, next: NextFunction) => {
  //     const authHeader = req.headers.authorization;

  //     if (!authHeader?.startsWith("Bearer ")) {
  //       return res.status(401).json({
  //         status: false,
  //         status_code: 401,
  //         message: "Unauthorized: Missing token",
  //       });
  //     }

  //     const token = authHeader.split(" ")[1];

  //     try {
  //       const decoded = jwt.verify(
  //         token,
  //         process.env.ACCESS_SECRET as string,
  //       ) as {
  //         id?: string;
  //         venueId?: string;
  //         role: string;
  //         exp: number;
  //       };

  //       const role = decoded.role?.toUpperCase();

  //       if (!role) {
  //         return res.status(401).json({
  //           status: false,
  //           status_code: 401,
  //           message: "Unauthorized: Role not found in token",
  //         });
  //       }

  //       // check blacklist
  //       const blacklistKey = decoded.venueId
  //         ? `blacklist:venue:${token}`
  //         : `blacklist:${token}`;

  //       const blacklisted = await redis.get(blacklistKey);
  //       if (blacklisted) {
  //         return res.status(403).json({
  //           status: false,
  //           status_code: 403,
  //           message: "Token has been revoked",
  //         });
  //       }

  //       // role authorization
  //       if (!roles.includes(role as any)) {
  //         return res.status(403).json({
  //           status: false,
  //           status_code: 403,
  //           message: "Forbidden: Insufficient role",
  //         });
  //       }

  //       // attach entity
  //       if (decoded.venueId) {
  //         const venue = await venueRepository.findVenueById(decoded.venueId);
  //         if (!venue) {
  //           return res.status(404).json({
  //             status: false,
  //             status_code: 404,
  //             message: "Venue not found",
  //           });
  //         }
  //         (req as any).venue = venue;
  //       } else if (decoded.id) {
  //         const user = await userRepository.findById(decoded.id);
  //         if (!user) {
  //           return res.status(404).json({
  //             status: false,
  //             status_code: 404,
  //             message: "User not found",
  //           });
  //         }
  //         (req as any).user = user;
  //       } else {
  //         return res.status(401).json({
  //           status: false,
  //           status_code: 401,
  //           message: "Invalid token payload",
  //         });
  //       }

  //       next();
  //     } catch (error: any) {
  //       const isExpired = error.name === "TokenExpiredError";

  //       return res.status(401).json({
  //         status: false,
  //         status_code: 401,
  //         message: isExpired
  //           ? "Token expired. Please refresh."
  //           : "Unauthorized: Invalid token",
  //         isExpired,
  //       });
  //     }
  //   };
  // }

  async logoutAuth(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token) as any;

    const isVenue = !!decoded?.venueId;
    const exp = decoded?.exp;
    const id = isVenue ? decoded.venueId : decoded?.id;

    if (!exp || !id) return res.status(400).json({ message: "Invalid token" });

    const ttl = exp - Math.floor(Date.now() / 1000);
    const blacklistKey = isVenue
      ? `blacklist:venue:${token}`
      : `blacklist:${token}`;

    await redis.setex(blacklistKey, ttl, "true");
    const refreshKey = isVenue ? `venue:refresh:${id}` : `refresh:${id}`;
    await redis.del(refreshKey);

    return res.json({
      status: true,
      status_code: 200,
      message: "Logged out successfully",
    });
  }
}
