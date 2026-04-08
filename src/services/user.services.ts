import { Point, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { publisher } from "config/redis.config";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { sendEmail } from "utils/mail";
import { uploadImage } from "utils/uploadS3";
import {
  BookingRepository,
  PointsRepository,
  UserBalanceRepository,
  UserRepository,
  UserRoleRepository,
  VenueRepository,
} from "../repositories";
import { RateLimiterService } from "./rateLimiterService";

const prisma = new PrismaClient();
const redis = new Redis();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userRepository = new UserRepository();
const pointRepository = new PointsRepository();
const bookingRepository = new BookingRepository();
const userBalanceRepository = new UserBalanceRepository();
const userRoleRepository = new UserRoleRepository();
const venueRepository = new VenueRepository();
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

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const user = await userRepository.create({
      email: data.email,
      name: data.name,
      username: data.username,
      password: hashedPassword,
      photo,
      isVerified: false,
      emailVerifyToken: hashedToken,
      emailVerifyExpiry: verificationExpiry,
    });

    await sendEmail(
      user.email,
      "Verify Your Email",
      `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          
          <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            
            <tr>
              <td align="center">
                <h2 style="margin:0; color:#333;">Email Verification</h2>
              </td>
            </tr>

            <tr>
              <td style="padding-top:20px; color:#555; font-size:14px; line-height:22px;">
                <p style="margin:0;">Hello <strong>${user.name}</strong>,</p>
                <p style="margin:15px 0;">
                  Thank you for registering. Please verify your email address by clicking the button below:
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:25px 0;">
                <a href="${process.env.API_URL}/auth/verify-email?token=${rawToken}"
                  style="
                    background-color:#2563eb;
                    color:#ffffff;
                    text-decoration:none;
                    padding:14px 28px;
                    border-radius:6px;
                    font-size:14px;
                    font-weight:bold;
                    display:inline-block;
                  ">
                  Verify Account
                </a>
              </td>
            </tr>

            <tr>
              <td style="color:#777; font-size:13px; line-height:20px;">
                <p style="margin:0;">
                  This verification link will expire in <strong>1 hour</strong>.
                </p>
                <p style="margin:15px 0 0 0;">
                  If the button above does not work, copy and paste this link into your browser:
                </p>
                <p style="word-break:break-all; color:#2563eb; font-size:12px;">
                  ${process.env.API_URL}/auth/verify-email?token=${rawToken}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding-top:30px; font-size:12px; color:#aaa; text-align:center;">
                © ${new Date().getFullYear()} Your Company Name. All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `,
    );

    return {
      message: "Verification email sent",
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

    // cek email
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
      isVerified: true,
    });

    await userRoleRepository.assignGlobalRole({
      userId: user.id,
      role: Role.ADMIN,
    });

    return {
      message: "Admin registered successfully",
      userId: user.id,
    };
  }

  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userRepository.findByVerifyToken(hashedToken);

    if (!user) throw new Error("INVALID_OR_EXPIRED_TOKEN");

    if (user.emailVerifyExpiry! < new Date()) throw new Error("TOKEN_EXPIRED");

    const result = await prisma.$transaction(async (tx) => {
      await userRepository.verifyUser(user.id, tx);

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
          role: Role.CUSTOMER,
        },
        tx,
      );

      return { balance, point };
    });

    await publisher.publish(
      "point-events",
      JSON.stringify({ event: "point:updated", payload: result.point }),
    );

    await publisher.publish(
      "balance-events",
      JSON.stringify({ event: "balance:updated", payload: result.balance }),
    );

    return { message: "Account verified successfully" };
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
          "If your email is not verified, a verification link has been sent.",
      };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await userRepository.update(user.id, {
      emailVerifyToken: hashedToken,
      emailVerifyExpiry: verificationExpiry,
    });

    await sendEmail(
      user.email,
      "Verify Your Email - Resend",
      `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Email Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        
        <table width="500" cellpadding="0" cellspacing="0" 
          style="background:#ffffff; border-radius:8px; padding:40px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
          
          <tr>
            <td align="center">
              <h2 style="margin:0; color:#333;">Email Verification</h2>
            </td>
          </tr>

          <tr>
            <td style="padding-top:20px; color:#555; font-size:14px; line-height:22px;">
              <p style="margin:0;">Hello <strong>${user.name}</strong>,</p>
              <p style="margin:15px 0;">
                You requested a new verification email. Please confirm your account by clicking the button below:
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:25px 0;">
              <a href="${process.env.API_URL}/auth/verify-email?token=${rawToken}"
                style="
                  background-color:#2563eb;
                  color:#ffffff;
                  text-decoration:none;
                  padding:14px 28px;
                  border-radius:6px;
                  font-size:14px;
                  font-weight:bold;
                  display:inline-block;
                ">
                Verify Account
              </a>
            </td>
          </tr>
          
            <tr>
              <td style="color:#777; font-size:13px; line-height:20px;">
                <p style="margin:0;">
                  This verification link will expire in <strong>1 hour</strong>.
                </p>
                <p style="margin:15px 0 0 0;">
                  If the button above does not work, copy and paste this link into your browser:
                </p>
                <p style="word-break:break-all; color:#2563eb; font-size:12px;">
                  ${process.env.API_URL}/auth/verify-email?token=${rawToken}
                </p>
              </td>
            </tr>

          <tr>
            <td style="color:#777; font-size:13px; line-height:20px;">
              <p style="margin:0;">
                This verification link will expire in <strong>1 hour</strong>.
              </p>
              <p style="margin:15px 0 0 0;">
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:30px; font-size:12px; color:#aaa; text-align:center;">
              © ${new Date().getFullYear()} Your Company Name. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`,
    );

    return { message: "Verification email resent" };
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
        username: name || "Google User",
        password: "",
        photo: picture,
        googleId: sub,
        isVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
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
      profileLikeCount: user.profileLikeCount,
      profileViewCount: user.profileViewCount,
      roles: {
        global: globalRoles,
        venues: venueRoles,
        events: eventRoles,
      },
    };
  }

  async findAllUsers(search?: string) {
    console.log(search);

    return userRepository.findAllUsers(search);
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

    const resetUrl = `${process.env.FRONTEND_URL}/resetPassword?token=${rawToken}`;

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
              href="${resetUrl}" 
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
          totalSpend: Number(booking.totalPrice),
        };
      } else {
        topSpender[key].totalSpend += Number(booking.totalPrice);
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
