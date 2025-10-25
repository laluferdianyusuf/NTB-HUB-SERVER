import { Request, Response } from "express";
import { UserService } from "../services/user.services";

const userService = new UserService();

export class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const result = await userService.getAllUsers();
      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await userService.getUserById(req.params.id);
      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const result = await userService.createUser(req.body);
      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await userService.updateUser(req.params.id, req.body);
      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await userService.deleteUser(req.params.id);
      res.status(result.status_code).json(result);
    } catch (error: any) {
      res.status(500).json({
        status: false,
        status_code: 500,
        message: error.message || "Internal Server Error",
        data: null,
      });
    }
  }
}
