import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import bcrypt from "bcryptjs";

const forgotPasswordSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { email, token, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return apiError("Invalid email", 401);

    const resetEntry = await prisma.passwordResetToken.findUnique({
      where: {
        token: token,
      },
    });
    if (!resetEntry || new Date() > resetEntry.expiresAt) {
      return apiError("Invalid or expired token", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { token: token },
    });

    const response = apiSuccess({ message: "Password updated successfully" });
    response.cookies.delete("reset_password_token");

    return response;
  } catch (error) {
    console.error("Forgot Password token generation error:", error);
    return apiError("Internal server error", 500);
  }
}
