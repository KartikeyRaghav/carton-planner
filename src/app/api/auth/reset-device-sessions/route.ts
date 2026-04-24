import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("device_reset_token")?.value ||
      new URL(req.url).searchParams.get("token");

    if (!token) return apiError("Invalid or missing token", 400);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetDeviceToken: hashedToken,
        resetDeviceTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return apiError("Invalid or expired token", 400);
    }

    await prisma.deviceSession.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetDeviceToken: null,
        resetDeviceTokenExpiry: null,
      },
    });

    const response = apiSuccess({
      message: "All devices logged out. You can login again.",
    });

    response.cookies.delete("device_id");
    response.cookies.delete("auth_token");
    response.cookies.delete("device_reset_token");

    return response;
  } catch (err) {
    console.error(err);
    return apiError("Internal server error", 500);
  }
}
