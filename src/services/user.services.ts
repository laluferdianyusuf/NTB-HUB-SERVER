import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { LINK } from "utils/link";
import { sendEmail } from "utils/mail";
import { uploadImage } from "utils/uploadS3";
import {
  BookingRepository,
  InvitationKeyRepository,
  PointsRepository,
  UserBalanceRepository,
  UserRepository,
  UserRoleRepository,
  VenueRepository,
} from "../repositories";
import { AccountService } from "./account.services";
import { RateLimiterService } from "./rateLimiterService";

const prisma = new PrismaClient();
const redis = new Redis();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userRepository = new UserRepository();
const pointRepository = new PointsRepository();
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const userRoleRepository = new UserRoleRepository();
const invitationKeyRepository = new InvitationKeyRepository();
const venueRepository = new VenueRepository();
const accountService = new AccountService();
const rateLimiter = new RateLimiterService();

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
    username: string;
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

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await userRepository.create({
      email: data.email,
      name: data.name,
      username: data.username,
      password: hashedPassword,
      photo,
      isVerified: false,
    });

    const pin = crypto.randomInt(100000, 999999).toString();

    const hashedPin = await bcrypt.hash(pin, 10);

    await redis.set(
      `verify-pin:${user.id}`,
      hashedPin,
      "EX",
      5 * 60, // 5 menit
    );

    await redis.set(`verify-pin-attempt:${user.id}`, "0", "EX", 5 * 60);

    console.log(pin);

    await sendEmail(
      user.email,
      "Verify Your Account",
      `
    <html>
      <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:30px;">
        <div style="max-width:500px;margin:auto;background:#fff;padding:30px;border-radius:10px;">
          
          <h2>Email Verification</h2>

          <p>Hello <b>${user.name}</b>,</p>

          <p>Use the following verification code to activate your account:</p>

          <div style="font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;margin:20px 0;">
            ${pin}
          </div>

          <p style="color:#777;font-size:13px;">
            This code will expire in <b>5 minutes</b>.
          </p>

          <p style="color:#999;font-size:12px;">
            If you didn't request this, ignore this email.
          </p>

        </div>
      </body>
    </html>
    `,
    );

    return {
      message: "Verification code sent to email",

      data: {
        userId: user.id,
        email: user.email,
      },
    };
  }

  async registerAdmin(
    data: {
      email: string;
      name: string;
      username: string;
      password: string;
      file?: Express.Multer.File;
    },
    secretKey?: string,
  ) {
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      throw new Error("UNAUTHORIZED");
    }

    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new Error("EMAIL_ALREADY_REGISTERED");

    let photo: string | null = null;

    if (data.file) {
      const img = await uploadImage({ file: data.file, folder: "users" });
      photo = img.url;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await userRepository.create(
        {
          email: data.email,
          name: data.name,
          username: data.username,
          password: hashedPassword,
          photo,
          isVerified: true,
        },
        tx,
      );

      await userRoleRepository.assignGlobalRole(
        {
          userId: user.id,
          role: Role.ADMIN,
        },
        tx,
      );

      await accountService.ensureAccount(
        {
          type: "USER",
          userId: user.id,
        },
        tx,
      );

      return user;
    });

    return {
      message: "Admin registered successfully",
      data: {
        userId: result.id,
        email: result.email,
      },
    };
  }

  async verifyPinEmail(userId: string, pin: string) {
    const storedHash = await redis.get(`verify-pin:${userId}`);
    if (!storedHash) throw new Error("PIN_EXPIRED");

    const attemptsKey = `verify-pin-attempt:${userId}`;
    const attempts = parseInt((await redis.get(attemptsKey)) || "0");

    if (attempts >= 5) {
      throw new Error("TOO_MANY_ATTEMPTS");
    }

    const isValid = await bcrypt.compare(pin, storedHash);

    if (!isValid) {
      await redis.set(attemptsKey, String(attempts + 1), "EX", 300);
      throw new Error("INVALID_PIN");
    }

    const user = await userRepository.verifyUser(userId);

    await redis.del(`verify-pin:${userId}`);
    await redis.del(attemptsKey);

    return {
      message: "Account verified successfully",
      data: {
        userId: user.id,
        email: user.email,
      },
    };
  }

  async resendVerification(email: string, ip: string) {
    const emailKey = `rate:resend:email:${email}`;
    const ipKey = `rate:resend:ip:${ip}`;

    await rateLimiter.checkLimit(emailKey, 3, 600);
    await rateLimiter.checkLimit(ipKey, 10, 600);

    const user = await userRepository.findByEmail(email);

    if (!user || user.isVerified) {
      return {
        message:
          "If your email is not verified, a verification code has been sent.",
      };
    }

    const pin = crypto.randomInt(100000, 999999).toString();

    console.log(pin);

    const hashedPin = await bcrypt.hash(pin, 10);

    await redis.set(`verify-pin:${user.id}`, hashedPin, "EX", 5 * 60);

    await redis.set(`verify-pin-attempt:${user.id}`, "0", "EX", 5 * 60);

    await sendEmail(
      user.email,
      "Verify Your Email - Resend Code",
      `
    <html>
      <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:30px;">
        <div style="max-width:500px;margin:auto;background:#fff;padding:30px;border-radius:10px;">

          <h2>Email Verification</h2>

          <p>Hello <b>${user.name}</b>,</p>

          <p>Your new verification code is:</p>

          <div style="font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;margin:20px 0;">
            ${pin}
          </div>

          <p style="color:#777;font-size:13px;">
            This code will expire in <b>5 minutes</b>.
          </p>

          <p style="color:#999;font-size:12px;">
            If you didn't request this, ignore this email.
          </p>

        </div>
      </body>
    </html>
    `,
    );

    return {
      message: "Verification code resent successfully",
    };
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("USER_NOT_FOUND");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("INVALID_PASSWORD");

    if (!user.isVerified) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    const tokens = await this.generateTokens(user.id);

    await redis.set(
      `user:${user.id}`,
      JSON.stringify({
        username: user.username,
        avatar: user.photo,
      }),
      "EX",
      3600,
    );

    await userRoleRepository.assignGlobalRole({
      userId: user.id,
      role: Role.CUSTOMER,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
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
      user = await prisma.$transaction(async (tx) => {
        const newUser = await userRepository.create(
          {
            email: String(email),
            name: name || "Google User",
            username: name || "Google User",
            password: "",
            photo: picture,
            googleId: sub,
            isVerified: true,
            emailVerifyToken: null,
            emailVerifyExpiry: null,
          },
          tx,
        );

        await userRoleRepository.assignGlobalRole(
          {
            userId: newUser.id,
            role: Role.CUSTOMER,
          },
          tx,
        );

        await accountService.ensureAccount(
          {
            type: "USER",
            userId: newUser.id,
          },
          tx,
        );

        return newUser;
      });
    }

    await redis.set(
      `user:${user.id}`,
      JSON.stringify({
        username: user.username,
        avatar: user.photo,
      }),
      "EX",
      3600,
    );

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
    const invitations = await invitationKeyRepository.findActiveByEmail(
      user.email,
    );

    const globalRoles = roles
      .filter((r) => !r.venueId && !r.eventId && r.isActive)
      .map((r) => r.role);

    const venueRoles = roles
      .filter((r) => r.venueId && r.isActive)
      .map((r) => ({
        venueId: r.venueId!,
        accounts: r.venue?.accounts!,
        name: r.venue?.name!,
        image: r.venue?.image!,
        role: r.role,
      }));

    const eventRoles = roles
      .filter((r) => r.eventId && r.isActive)
      .map((r) => ({
        eventId: r.eventId!,
        accounts: r.event?.account!,
        name: r.event?.name!,
        image: r.event?.image!,
        role: r.role,
      }));

    const pendingVenueInvitations = invitations
      .filter((inv) => inv.venueId)
      .map((inv) => ({
        venueId: inv.venueId!,
        key: inv.key,
        expiresAt: inv.expiresAt,
      }));

    const pendingEventInvitations = invitations
      .filter((inv) => inv.eventId)
      .map((inv) => ({
        eventId: inv.eventId!,
        key: inv.key,
        expiresAt: inv.expiresAt,
      }));

    await redis.set(
      `user:${user.id}`,
      JSON.stringify({
        username: user.username,
        avatar: user.photo,
      }),
      "EX",
      3600,
    );

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.photo,
      isVerified: user.isVerified,
      biometricEnabled: user.biometricEnabled,
      profileLikeCount: user.profileLikeCount,
      profileViewCount: user.profileViewCount,
      accounts: user.accounts,

      roles: {
        global: globalRoles,
        venues: venueRoles,
        events: eventRoles,
      },

      invitations: {
        venues: pendingVenueInvitations,
        events: pendingEventInvitations,
      },
    };
  }

  async getUserById(userId: string) {
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

    await redis.set(
      `user:${user.id}`,
      JSON.stringify({
        username: user.username,
        avatar: user.photo,
      }),
      "EX",
      3600,
    );

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      photo: user.photo,
      isVerified: user.isVerified,
      biometricEnabled: user.biometricEnabled,
      profileLikeCount: user.profileLikeCount,
      profileViewCount: user.profileViewCount,
      roles: {
        global: globalRoles,
        venues: venueRoles,
        events: eventRoles,
      },
    };
  }

  async findAllUsers(params?: {
    search?: string;
    limit?: number;
    page?: number;
    pageSize?: number;
  }) {
    const { search, limit, page = 1, pageSize = 10 } = params || {};

    const take = limit ?? pageSize;
    const skip = (page - 1) * take;

    const [users, total] = await Promise.all([
      userRepository.findAllUsers({
        search,
        limit: take,
        page,
        pageSize: take,
      }),

      userRepository.countAllUsers({
        search,
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        pageSize: take,
        totalPages: Math.ceil(total / take),
        hasNextPage: page * take < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findDetailUser(userId: string) {
    if (!userId) throw new Error("User id is required");

    return userRepository.findById(userId);
  }

  async updateUser(
    userId: string,
    data: {
      name?: string;
      username?: string;
      phone?: string;
      address?: string;
      email?: string;
    },
    file?: Express.Multer.File,
  ) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new Error("USER NOT FOUND");

    let photo = user.photo;

    if (file) {
      const img = await uploadImage({ file: file, folder: "users" });
      photo = img.url;
    }

    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) {
        throw new Error("Email already in use");
      }
    }

    return userRepository.update(userId, {
      ...data,
      photo,
    });
  }

  async changePassword(
    userId: string,
    data: {
      oldPassword: string;
      newPassword: string;
    },
  ): Promise<void> {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(data.oldPassword, user.password);

    if (!valid) {
      throw new Error("Old password is incorrect");
    }

    if (data.oldPassword === data.newPassword) {
      throw new Error("New password must be different");
    }

    const hashed = await bcrypt.hash(data.newPassword, 10);

    await userRepository.updatePassword(userId, hashed);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new Error("Email not registered");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expire = new Date(Date.now() + 15 * 60 * 1000);

    await userRepository.setResetToken(user.id, hashedToken, expire);

    const url = `${LINK}forgotPassword`;

    await sendEmail(
      user.email,
      "Reset Password",
      `
        <html>
          <body style="font-family:Arial,sans-serif">
            <h2>Reset Password</h2>
            <p>Hello ${user.name},</p>
            <p>Click the button below to reset your password:</p>
            <a 
              href="${url}" 
              style="display:inline-block;padding:10px 20px;background:black;color:white;text-decoration:none;"
            >
              Reset Password
            </a>
            <p style="font-size:12px;color:gray">
              This link expires in 15 minutes
            </p>
          </body>
        </html>
      `,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userRepository.findByResetToken(hashedToken);

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await userRepository.updatePasswordAndClearToken(user.id, hashedPassword);
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

      throw new Error("Invalid PIN");
    }

    await userRepository.update(id, {
      pinFailedCount: 0,
      pinLockedUntil: null,
    });
  }

  async getUserTopSpender(params?: {
    limit?: number;
    page?: number;
    pageSize?: number;
  }) {
    const aggregated = await bookingRepository.getTotalSpendingPerUser(params);

    const userIds = aggregated.map((a) => a.userId);
    if (!userIds.length) return [];

    const users = await userRepository.findUsersWithCommunities(userIds);

    const venueAgg = await bookingRepository.getTopVenuePerUser(userIds);

    const bestVenueMap = new Map<string, string>();

    for (const v of venueAgg) {
      if (!bestVenueMap.has(v.userId)) {
        bestVenueMap.set(v.userId, v.venueId);
      }
    }

    const venueIds = [...new Set(venueAgg.map((v) => v.venueId))];
    const venues = await venueRepository.findByIds(venueIds);

    const venueMap = new Map(venues.map((v) => [v.id, v]));

    return aggregated.map((a, index) => {
      const user = users.find((u) => u.id === a.userId);

      return {
        id: user?.id,
        name: user?.name,
        avatar: user?.photo,
        totalSpending: Number(a._sum.totalPrice || 0),
        rank: index + 1 + ((params?.page || 1) - 1) * (params?.pageSize || 10),
        venue: venueMap.get(bestVenueMap.get(a.userId) || ""),
        communities: user?.communityMemberships.map((cm) => cm.community) ?? [],
      };
    });
  }
}
