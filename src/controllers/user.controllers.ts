import { Request, Response } from "express";
import { Server } from "socket.io";
import { UserService } from "../services/user.services";

export class UserController {
  private userService: UserService;
  private io?: Server;

  constructor(io?: Server) {
    this.userService = new UserService();
    this.io = io;
  }

  async getAll(req: Request, res: Response) {
    try {
      const result = await this.userService.getAllUsers();
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
      const result = await this.userService.getUserById(req.params.id);
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
      const result = await this.userService.createUser(req.body);

      if (result.status && result.data) {
        this.io?.emit("user:created", result.data);
      }

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

  async login(req: Request, res: Response) {
    try {
      const result = await this.userService.login(req.body);

      if (result.status && result.data) {
        this.io?.emit("user:created", result.data);
      }

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
      const result = await this.userService.updateUser(req.params.id, req.body);

      if (result.status && result.data) {
        this.io?.emit("user:updated", result.data);
      }

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
      const result = await this.userService.deleteUser(req.params.id);

      if (result.status) {
        this.io?.emit("user:deleted", { id: req.params.id });
      }

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
