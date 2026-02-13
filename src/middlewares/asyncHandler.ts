import { NextFunction, Response } from "express";

export const asyncHandler =
  (fn: any) => (req: any, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
