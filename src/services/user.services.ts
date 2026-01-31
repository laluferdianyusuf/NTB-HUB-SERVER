import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient, Point, Role } from "@prisma/client";

import {
  UserRepository,
  PointsRepository,
  UserBalanceRepository,
  UserRoleRepository,
} from "../repositories";
import { uploadImage } from "utils/uploadS3";
import { publisher } from "config/redis.config";

const prisma = new PrismaClient();
const redis = new Redis();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userRepository = new UserRepository();
const pointRepository = new PointsRepository();
const userBalanceRepository = new UserBalanceRepository();
const userRoleRepository = new UserRoleRepository();

export class UserService {
  async register(data: {
    email: string;
    name: string;
    password: string;
    role: Role;
    file?: Express.Multer.File;
  }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new Error("EMAIL_ALREADY_REGISTERED");

    let photo: string | null = null;
    if (data.file) {
      const img = await uploadImage({ file: data.file, folder: "users" });
      photo = img.url;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await userRepository.create(
        {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          photo,
        },
        tx,
      );

      const balance = await userBalanceRepository.generateInitialBalance(
        user.id,
        tx,
      );

      const point = await pointRepository.generatePoints(
        {
          userId: user.id,
          points: 0,
          activity: "REGISTER",
          reference: user.id,
        } as Point,
        tx,
      );

      await userRoleRepository.assignGlobalRole(
        {
          userId: user.id,
          role: data.role,
        },
        tx,
      );

      return { user, balance, point };
    });

    await publisher.publish(
      "point-events",
      JSON.stringify({ event: "point:updated", payload: result.point }),
    );

    await publisher.publish(
      "balance-events",
      JSON.stringify({ event: "balance:updated", payload: result.balance }),
    );

    const tokens = await this.generateTokens(result.user.id);

    return {
      user: result.user,
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("USER_NOT_FOUND");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("INVALID_PASSWORD");

    const tokens = await this.generateTokens(user.id);

    return { user, ...tokens };
  }

  async googleLogin(idToken: string) {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("INVALID_GOOGLE_TOKEN");

    const { email, name, picture, sub } = payload;

    let user = await userRepository.findByEmail(email);

    if (!user) {
      user = await userRepository.create({
        email,
        name: name || "Google User",
        password: "",
        photo: picture,
        googleId: sub,
      });

      await userRoleRepository.assignGlobalRole({
        userId: user.id,
        role: Role.CUSTOMER,
      });
    }

    const tokens = await this.generateTokens(user.id);

    return { user, ...tokens };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new Error("MISSING_REFRESH_TOKEN");

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!,
    ) as any;

    const stored = await redis.get(`refresh:${decoded.sub}`);
    if (!stored || stored !== refreshToken)
      throw new Error("INVALID_REFRESH_TOKEN");

    return this.generateTokens(decoded.sub);
  }

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const roles = await userRoleRepository.findByUserId(userId);

    const globalRoles = roles
      .filter((r) => !r.venueId && !r.eventId && r.isActive)
      .map((r) => r.role);

    const venueRoles = roles
      .filter((r) => r.venueId && r.isActive)
      .map((r) => ({
        venueId: r.venueId!,
        role: r.role,
      }));

    const eventRoles = roles
      .filter((r) => r.eventId && r.isActive)
      .map((r) => ({
        eventId: r.eventId!,
        role: r.role,
      }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.photo,
      isVerified: user.isVerified,
      roles: {
        global: globalRoles,
        venues: venueRoles,
        events: eventRoles,
      },
    };
  }

  async findAllUsers() {
    return userRepository.findAll();
  }

  async findDetailUser(userId: string) {
    if (!userId) throw new Error("User id is required");

    return userRepository.findById(userId);
  }

  async updateUser(
    userId: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      isVerified?: boolean;
    },
    file?: Express.Multer.File,
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    let photo = user.photo;

    if (file) {
      const img = await uploadImage({ file: file, folder: "users" });
      photo = img.url;
    }

    let password = user.password;
    if (data.password) {
      password = await bcrypt.hash(data.password, 10);
    }

    return userRepository.update(userId, {
      name: data.name,
      email: data.email,
      password,
      photo,
      isVerified: data.isVerified,
    });
  }

  async deleteUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    return userRepository.delete(userId);
  }

  private async generateTokens(userId: string) {
    const accessToken = jwt.sign({ sub: userId }, process.env.ACCESS_SECRET!, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { sub: userId },
      process.env.REFRESH_SECRET!,
      { expiresIn: "7d" },
    );

    await redis.set(`refresh:${userId}`, refreshToken, "EX", 7 * 86400);

    return { accessToken, refreshToken };
  }
}
