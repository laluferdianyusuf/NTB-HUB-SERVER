import { Request, Response } from "express";
import { UserRepository } from "repositories/user.repo";

const userRepository = new UserRepository();

export class AuthMiddlewares {
  async authentication(req: Request, res: Response) {
    try {
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Authentication error" + error,
      };
    }
  }
}
