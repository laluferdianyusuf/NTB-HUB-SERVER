import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    export interface Request {
      venue?: JwtPayload | string | any;
    }
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
