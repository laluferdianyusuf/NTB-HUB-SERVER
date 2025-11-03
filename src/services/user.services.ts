import bcrypt from "bcryptjs";
import {
  UserRepository,
  PointsRepository,
  UserBalanceRepository,
} from "../repositories";
import jwt from "jsonwebtoken";
import { Point, User } from "@prisma/client";

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

  async createUser(data: User) {
    try {
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
      const newUser = await userRepository.create({
        ...data,
        password: hashedPassword,
      });

      await userBalanceRepository.generateInitialBalance(newUser.id);
      await pointRepository.generatePoints({
        userId: newUser.id,
        points: 0,
        activity: "REGISTER",
        reference: newUser.id,
      } as Point);

      return {
        status: true,
        status_code: 201,
        message: "User created successfully",
        data: newUser,
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
          status_code: 407,
          message: "Wrong email",
          data: null,
        };
      }

      const isPasswordCorrect = bcrypt.compareSync(
        data.password,
        existing.password
      );

      if (!isPasswordCorrect) {
        return {
          status: false,
          status_code: 407,
          message: "Password doesn't match",
          data: null,
        };
      }

      const token = jwt.sign(
        {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          createdAt: existing.createdAt,
        },
        "jwt-secret"
      );
      return {
        status: true,
        status_code: 201,
        message: "Logged in successfully",
        data: token,
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

  async updateUser(id: string, data: Partial<User>) {
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

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
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
}
