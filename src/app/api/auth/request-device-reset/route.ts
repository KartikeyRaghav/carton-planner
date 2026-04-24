import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) return apiError("Email is required", 400);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return apiError("No account with this email found");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiry = new Date(Date.now() + 1000 * 60 * 15);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetDeviceToken: hashedToken,
        resetDeviceTokenExpiry: expiry,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-devices?token=${rawToken}`;

    await sendEmail(
      "reset-device-sessions@modisoftech.org",
      email,
      "Your Reset Device Sessions Link",
      "reset-device-sessions",
      { name: user.name, reset_link: resetLink },
    );

    const response = apiSuccess({
      message: "Reset link sent if account exists",
    });

    response.cookies.set("device_reset_token", rawToken, {
      httpOnly: true,
      maxAge: 60 * 15,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return apiError("Internal server error", 500);
  }
}
