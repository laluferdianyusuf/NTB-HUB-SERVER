import { Request, Response } from "express";
import { UserService } from "../services/user.services";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
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
  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    const result = await this.userService.refreshToken(refreshToken);
    return res.status(result.status_code).json(result);
  }

  async update(req: Request, res: Response) {
    try {
      const result = await this.userService.updateUser(req.params.id, req.body);

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

  async currentUser(req: Request, res: Response) {
    const user = (req as any).user;

    res.status(200).json({
      status: true,
      status_code: 200,
      message: "User retrieved",
      data: user,
    });
  }
}
