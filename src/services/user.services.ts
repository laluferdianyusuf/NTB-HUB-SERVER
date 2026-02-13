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
  BookingRepository,
  VenueRepository,
} from "../repositories";
import { uploadImage } from "utils/uploadS3";
import { publisher } from "config/redis.config";

const prisma = new PrismaClient();
const redis = new Redis();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userRepository = new UserRepository();
const pointRepository = new PointsRepository();
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const userRoleRepository = new UserRoleRepository();
const venueRepository = new VenueRepository();

export class UserService {
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
      user: {
        id: result.user.id,
        name: result.user.name,
        username: result.user.username,
        email: result.user.email,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("USER_NOT_FOUND");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("INVALID_PASSWORD");

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
      ...tokens,
    };
  }

  async googleLogin(idToken: string) {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("INVALID_GOOGLE_TOKEN");

    const { email, name, picture, sub } = payload;

    let user = await userRepository.findByEmail(String(email));

    if (!user) {
      user = await userRepository.create({
        email: String(email),
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

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
      ...tokens,
    };
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
      biometricEnabled: user.biometricEnabled,
      roles: {
        global: globalRoles,
        venues: venueRoles,
        events: eventRoles,
      },
    };
  }

  async findAllUsers() {
    return userRepository.findAllUsers();
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

  async setTransactionPin(id: string, pin: string) {
    if (!id) {
      throw new Error("Id is required");
    }

    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    if (!/^\d{6}$/.test(pin)) {
      throw new Error("Pin must be 6 digit number");
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    await userRepository.updateTransactionPin(id, hashedPin);
  }

  async setBiometric(id: string, biometric: boolean) {
    if (!id) {
      throw new Error("Id is required");
    }

    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    await userRepository.updateBiometric(id, biometric);
  }

  async verifyPin(id: string, pin: string) {
    if (!id) {
      throw new Error("Id is required");
    }

    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.transactionPin) {
      throw new Error("PIN not set");
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new Error("PIN locked, try it later");
    }

    const isValid = await bcrypt.compare(pin, user.transactionPin);

    if (!isValid) {
      const failedCount = user.pinFailedCount + 1;

      await userRepository.update(id, {
        pinFailedCount: failedCount,
        pinLockedUntil:
          failedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      });
    }

    await userRepository.update(id, {
      pinFailedCount: 0,
      pinLockedUntil: null,
    });
  }

  async getUserTopSpender() {
    const users = await userRepository.findAllUsers();
    const bookings = await bookingRepository.findAllBooking();

    const topSpender: Record<string, { venueId: string; totalSpend: number }> =
      {};

    bookings.forEach((booking) => {
      const key = booking.userId;
      if (!topSpender[key]) {
        topSpender[key] = {
          venueId: booking.venueId,
          totalSpend: booking.totalPrice,
        };
      } else {
        topSpender[key].totalSpend += booking.totalPrice;
      }
    });

    const result = await Promise.all(
      users.map(async (user) => {
        const topSpenderInfo = topSpender[user.id];
        let venue = null;

        if (topSpenderInfo?.venueId) {
          venue = await venueRepository.findVenueById(topSpenderInfo.venueId);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.photo,
          events: user.eventOrders.map((eo) => eo.event),
          venue: venue,
          total: topSpenderInfo?.totalSpend ?? 0,
          communities: user.communityMemberships.map((cm) => cm.community),
        };
      }),
    );

    return result;
  }
}
