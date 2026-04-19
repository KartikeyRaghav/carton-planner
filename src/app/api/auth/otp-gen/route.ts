import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { otpToken } from "@/lib/jwt";
import { apiSuccess, apiError } from "@/lib/api-response";
import { sendEmail } from "@/lib/sendEmail";

const otpSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = otpSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { email } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError("Email already in use", 409);
    }

    const otp = Math.trunc(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const token = otpToken(email, otp);

    const otp_recored = await prisma.otpVerification.create({
      data: {
        token: token,
        expiresAt: expiresAt,
      },
    });

    await sendEmail(
      "otp@modisoftech.org",
      email,
      "OTP for Printex Signup",
      `Dear user,\n\nYour otp for signup is ${otp}.\n\nThis otp is valid for 15 minutes only.`,
    );

    const response = apiSuccess({ message: "ok" });
    response.cookies.set("otp_token_id", String(otp_recored.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 15,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Otp generation error:", error);
    return apiError("Internal server error", 500);
  }
}
