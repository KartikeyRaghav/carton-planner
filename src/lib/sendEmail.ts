import { Resend } from "resend";

// const transporter = nodemailer.createTransport({
//   host: "Gmail",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.SMTP_EMAIL,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  from: string,
  to: string,
  subject: string,
  template_id: string,
  variables: any,
) => {
  try {
    // const info = await transporter.sendMail({
    //   from: '"Printex" modisoftech@gmail.com',
    //   to,
    //   subject,
    //   text,
    // });
    resend.emails.send({
      from,
      to,
      subject,
      template: { id: template_id, variables },
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
