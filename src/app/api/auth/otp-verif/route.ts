import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtpToken } from "@/lib/jwt";
import { apiSuccess, apiError } from "@/lib/api-response";

const otpSchema = z.object({
  otp: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = otpSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { otp } = parsed.data;

    const token_id = req.cookies.get("otp_token_id")?.value;

    if (!token_id) {
      return apiError("Otp Token not found", 401);
    }

    const otpRecord = await prisma.otpVerification.findFirstOrThrow({
      where: {
        id: Number(token_id),
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    if (!otpRecord) {
      return apiError("Invalid OTP", 400);
    }

    if (new Date() > otpRecord.expiresAt) {
      return apiError("OTP has expired", 400);
    }

    const payload = await verifyOtpToken(otpRecord.token);

    if (payload?.otp != Number(otp)) {
      return apiError("Wrong OTP Entered", 400);
    }

    await prisma.otpVerification.delete({
      where: { id: otpRecord.id },
    });

    const response = apiSuccess({ message: "Email verified" });
    response.cookies.delete("otp_token_id");

    return response;
  } catch (error) {
    console.error("Otp verification error:", error);
    return apiError("Internal server error", 500);
  }
}
