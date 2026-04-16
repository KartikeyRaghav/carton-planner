import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "Gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"Printex" modisoftech@gmail.com',
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
