import bcrypt from "bcryptjs";
import {
  UserRepository,
  PointsRepository,
  UserBalanceRepository,
} from "../repositories";
import jwt from "jsonwebtoken";
import { Point, User, PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { publisher } from "config/redis.config";
import { uploadToCloudinary } from "utils/image";
import { OAuth2Client } from "google-auth-library";
import { uploadImage } from "utils/uploadS3";

const prisma = new PrismaClient();

const redis = new Redis();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userRepository = new UserRepository();
const pointRepository = new PointsRepository();
const userBalanceRepository = new UserBalanceRepository();

export class UserService {
  async getAllUsers() {
    try {
      const users = await userRepository.findAll();
      return {
        status: true,
        status_code: 200,
        message: "Users retrieved successfully",
        data: users,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Server error: " + error,
        data: null,
      };
    }
  }

  async getUserById(id: string) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }
      const points = await pointRepository.getTotalPoints(id);
      return {
        status: true,
        status_code: 200,
        message: "User retrieved successfully",
        data: { ...user, points },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Server error: " + error,
        data: null,
      };
    }
  }

  async createUser(data: User, file?: Express.Multer.File) {
    try {
      let imageUrl = null;

      if (file) {
        const image = await uploadImage({ file, folder: "users" });
        imageUrl = image.url;
      }

      const existing = await userRepository.findByEmail(data.email);
      if (existing) {
        return {
          status: false,
          status_code: 400,
          message: "Email already registered",
          data: null,
        };
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await userRepository.create(
          {
            ...data,
            password: hashedPassword,
            photo: imageUrl,
          },
          tx,
        );
        const balance = await userBalanceRepository.generateInitialBalance(
          newUser.id,
          tx,
        );

        const point = await pointRepository.generatePoints(
          {
            userId: newUser.id,
            points: 0,
            activity: "REGISTER",
            reference: newUser.id,
          } as Point,
          tx,
        );

        return { newUser, balance, point };
      });
      await publisher.publish(
        "point-events",
        JSON.stringify({
          event: "point:updated",
          payload: result.point,
        }),
      );

      await publisher.publish(
        "balance-events",
        JSON.stringify({
          event: "balance:updated",
          payload: result.balance,
        }),
      );

      return {
        status: true,
        status_code: 201,
        message: "User created successfully",
        data: result,
      };
    } catch (error) {
      console.log(error);

      return {
        status: false,
        status_code: 500,
        message: "Server error: " + error,
        data: null,
      };
    }
  }

  async login(data: User) {
    try {
      const existing = await userRepository.findByEmail(data.email);
      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }

      if (data.email !== existing.email) {
        return {
          status: false,
          status_code: 400,
          message: "Wrong email",
          data: null,
        };
      }

      const isPasswordCorrect = bcrypt.compareSync(
        data.password,
        existing.password,
      );

      if (!isPasswordCorrect) {
        return {
          status: false,
          status_code: 400,
          message: "Password doesn't match",
          data: null,
        };
      }

      const accessToken = jwt.sign(
        {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        },
        process.env.ACCESS_SECRET,
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      await redis.set(
        `refresh:${existing.id}`,
        refreshToken,
        "EX",
        7 * 24 * 60 * 60,
      );
      return {
        status: true,
        status_code: 201,
        message: "Logged in successfully",
        data: { accessToken, refreshToken, user: existing },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Server error: " + error,
        data: null,
      };
    }
  }

  async refreshToken(token: string) {
    try {
      if (!token) {
        return {
          status: false,
          status_code: 400,
          message: "Missing user refresh token",
          data: null,
        };
      }

      const decoded = jwt.verify(token, process.env.REFRESH_SECRET) as any;

      const storedToken = await redis.get(`refresh:${decoded.id}`);
      if (!storedToken || storedToken !== token) {
        return {
          status: false,
          status_code: 403,
          message: "Invalid or expired refresh token",
          data: null,
        };
      }

      const user = await userRepository.findById(decoded.id);
      if (!user) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }

      const newAccessToken = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.ACCESS_SECRET,
        { expiresIn: "15m" },
      );

      const newRefreshToken = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      await redis.set(
        `refresh:${user.id}`,
        newRefreshToken,
        "EX",
        7 * 24 * 60 * 60,
      );

      return {
        status: true,
        status_code: 200,
        message: "Access token refreshed successfully",
        data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
      };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return {
          status: false,
          status_code: 401,
          message: "Refresh token expired, please login again",
          data: null,
        };
      }

      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async updateUser(
    id: string,
    data: Partial<User>,
    file?: Express.Multer.File,
  ) {
    try {
      let imageUrl: string | null = null;

      if (file && file.path) {
        const image = await uploadImage({ file, folder: "users" });
        imageUrl = image.url;
      }

      const user = await userRepository.findById(id);
      if (!user) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      if (imageUrl) {
        data.photo = imageUrl;
      }

      const updatedUser = await userRepository.update(id, data);

      return {
        status: true,
        status_code: 200,
        message: "User updated successfully",
        data: updatedUser,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Server error: " + error,
        data: null,
      };
    }
  }

  async deleteUser(id: string) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        return {
          status: false,
          status_code: 404,
          message: "User not found",
          data: null,
        };
      }

      const deletedUser = await userRepository.delete(id);

      return {
        status: true,
        status_code: 200,
        message: "User deleted successfully",
        data: deletedUser,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Server error: " + error,
        data: null,
      };
    }
  }

  async googleLogin(idToken: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        return {
          status: false,
          status_code: 400,
          message: "Invalid Google token",
          data: null,
        };
      }

      const { email, name, picture, sub: googleId } = payload;

      let user = await userRepository.findByEmail(email);

      if (!user) {
        user = await userRepository.create({
          name: name || "Google User",
          email,
          password: "",
          photo: picture,
          googleId,
          role: "CUSTOMER",
        } as User);
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.ACCESS_SECRET!,
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.REFRESH_SECRET!,
        { expiresIn: "7d" },
      );

      await redis.set(
        `refresh:${user.id}`,
        refreshToken,
        "EX",
        7 * 24 * 60 * 60,
      );

      return {
        status: true,
        status_code: 200,
        message: "Login with Google successful",
        data: {
          accessToken,
          refreshToken,
          user,
        },
      };
    } catch (error) {
      console.log(error);

      return {
        status: false,
        status_code: 500,
        message: "Google login failed: " + error.message,
        data: null,
      };
    }
  }
}
