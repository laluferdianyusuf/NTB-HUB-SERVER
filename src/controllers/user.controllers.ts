import { Request, Response } from "express";
import { getClientIp } from "helpers/getClientIp";
import { sendError, sendSuccess } from "helpers/response";
import { UserService } from "services";

const userService = new UserService();

export class UserController {
  async register(req: Request, res: Response) {
    try {
      const result = await userService.register({
        email: req.body.email,
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        role: req.body.role,
        file: req.file,
      });

      return res.status(201).json({
        status: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async registerAdmin(req: Request, res: Response) {
    try {
      const result = await userService.registerAdmin({
        email: req.body.email,
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        file: req.file,
      });

      return res.status(201).json({
        status: true,
        message: "Admin registered successfully",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          message: "TOKEN_REQUIRED",
        });
      }

      const result = await userService.verifyEmail(token);

      sendSuccess(res, result, "Email verified");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const ip = getClientIp(req);

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      const result = await userService.resendVerification(email, ip);

      return res.status(200).json(result);
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await userService.login(req.body.email, req.body.password);

      return res.json({
        status: true,
        message: "Login successful",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async googleLogin(req: Request, res: Response) {
    try {
      const result = await userService.googleLogin(req.body.idToken);

      return res.json({
        status: true,
        message: "Google login successful",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const result = await userService.refresh(req.body.refreshToken);

      return res.json({
        status: true,
        message: "Token refreshed",
        data: result,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async me(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const data = await userService.getCurrentUser(user.id);

      return res.json({
        status: true,
        data,
      });
    } catch (error: any) {
      console.log(error);

      sendError(res, error.message || "Internal server error");
    }
  }

  async findAllUsers(req: Request, res: Response) {
    try {
      const { search } = req.query;

      const users = await userService.findAllUsers(search as string);

      return res.status(200).json({
        status: true,
        message: "Users retrieved successfully",
        data: users,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async findDetailUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const user = await userService.findDetailUser(userId);

      return res.status(200).json({
        status: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;
      const payload = req.body;
      const file = req.file;
      const user = await userService.updateUser(userId, payload, file);

      sendSuccess(res, user, "Update successful");
    } catch (error: any) {
      console.log(error);
      sendError(res, error.message || "Internal server error");
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { oldPassword, newPassword } = req.body;
      const user = await userService.changePassword(userId, {
        oldPassword,
        newPassword,
      });

      sendSuccess(res, user, "Change password successful");
    } catch (error: any) {
      console.log(error);
      sendError(res, error.message || "Internal server error");
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      await userService.forgotPassword(email);

      sendSuccess(res, "If the email exists, a reset form has been sent");
    } catch (error: any) {
      console.log(error);
      sendError(res, error.message || "Internal server error");
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      await userService.resetPassword(token, newPassword);

      sendSuccess(res, "Reset password successful");
    } catch (error: any) {
      console.log(error);
      sendError(res, error.message || "Internal server error");
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await userService.deleteUser(id);

      return res.status(200).json({
        status: true,
        message: "User deleted successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
  }

  async setTransactionPin(req: Request, res: Response) {
    try {
      const { pin } = req.body;
      await userService.setTransactionPin(req.params.id, String(pin) as string);

      sendSuccess(res, "Pin set");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async setBiometric(req: Request, res: Response) {
    try {
      const { biometric } = req.body;
      await userService.setBiometric(req.params.id, biometric as boolean);

      sendSuccess(res, "Biometric changed");
    } catch (error: any) {
      console.log(error);
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async verifyPin(req: Request, res: Response) {
    try {
      const { pin } = req.body;
      await userService.verifyPin(req.params.id, String(pin) as string);

      sendSuccess(res, "Pin verified");
    } catch (error: any) {
      sendError(res, error.message || "Internal Server Error");
    }
  }

  async findTopSpender(req: Request, res: Response) {
    try {
      const result = await userService.getUserTopSpender();

      sendSuccess(res, result, "User top spender");
    } catch (error: any) {
      sendError(res, error.message || "Internal server error");
    }
  }
}
