import nodemailer from "nodemailer";
import {
  SESv2Client,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SES_SECRET_KEY!,
  },
});

export const mailTransporter = nodemailer.createTransport(
  {
    SES: {
      sesClient,
      SendEmailCommand,
    },
  } as any
);