import { SESClient } from "@aws-sdk/client-ses";
import nodemailer from "nodemailer";

export const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SES_SECRET_KEY!,
  },
});

export const mailTransporter = nodemailer.createTransport({
  SES: { ses },
} as any);
