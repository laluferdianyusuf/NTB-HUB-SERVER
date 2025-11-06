import { mailTransporter } from "config/mail.config";

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: `"NTB HUB" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  await mailTransporter.sendMail(mailOptions);
};
