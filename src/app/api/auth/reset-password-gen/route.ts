import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { v4 } from "uuid";
import { sendEmail } from "@/lib/sendEmail";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return apiError("Invalid email", 401);

    const token = v4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token: token,
        expiresAt: expiresAt,
      },
    });

    const resetLink =
      process.env.NEXT_PUBLIC_APP_URL + "/auth/reset-password?token=" + token;

    await sendEmail(
      email,
      "Reset Password Link for Printex",
      `Dear user,\n\nYour reset password link is ${resetLink}.\n\nThis link is valid for 15 minutes only.`,
    );

    const response = apiSuccess({ token });

    return response;
  } catch (error) {
    console.error("Forgot Password token generation error:", error);
    return apiError("Internal server error", 500);
  }
}
