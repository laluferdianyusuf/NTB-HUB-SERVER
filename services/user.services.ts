import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/user.repository";
import { User } from "../models/user.model";

const userRepository = new UserRepository();

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

      return {
        status: true,
        status_code: 200,
        message: "User retrieved successfully",
        data: user,
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

      await userRepository.delete(id);

      return {
        status: true,
        status_code: 200,
        message: "User deleted successfully",
        data: null,
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
