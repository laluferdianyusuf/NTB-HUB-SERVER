import { SendEmailCommand } from "@aws-sdk/client-ses";
import { ses } from "config/sesClient";

export const sendEmail = async (to: string, subject: string, html: string) => {
  // const mailOptions = {
  //   from: `"NTB HUB" <${process.env.EMAIL_USER}>`,
  //   to,
  //   subject,
  //   html,
  // };
  // await mailTransporter.sendMail(mailOptions);

  const command = new SendEmailCommand({
    Source: `"NTB HUB" <${process.env.SES_FROM_EMAIL}>`,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
      },
    },
  });

  await ses.send(command);
};
