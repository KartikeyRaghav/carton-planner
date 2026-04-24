import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const deviceId = req.cookies.get("device_id")?.value;

    if (!userId || !deviceId) {
      return apiUnauthorized("Missing authentication context");
    }

    const session = await prisma.deviceSession.findFirst({
      where: {
        userId: Number(userId),
        deviceId,
        isActive: true,
      },
    });

    if (!session) {
      return apiUnauthorized("Invalid or expired device session");
    }

    await prisma.deviceSession.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        trialEndsAt: true,
        createdAt: true,
        subscription: true,
        devices: {
          where: { isActive: true },
          select: {
            id: true,
            deviceId: true,
            deviceName: true,
            userAgent: true,
            ipAddress: true,
            lastActive: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) return apiError("User not found", 404);

    const now = new Date();
    const isTrialing = user.trialEndsAt > now;

    const isSubscribed = !!(
      user.subscription &&
      user.subscription.status === "active" &&
      new Date(user.subscription.endDate) > now
    );

    let daysRemaining: number | undefined;

    if (isTrialing) {
      daysRemaining = Math.ceil(
        (user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
    } else if (isSubscribed && user.subscription) {
      daysRemaining = Math.ceil(
        (new Date(user.subscription.endDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    return apiSuccess({
      user,
      subscriptionStatus: {
        hasAccess: isTrialing || isSubscribed,
        isTrialing,
        isSubscribed,
        trialEndsAt: user.trialEndsAt,
        subscriptionEndsAt: user.subscription?.endDate,
        daysRemaining,
        reason: isSubscribed
          ? "Active subscription"
          : isTrialing
            ? "Trial active"
            : "No access",
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    return apiError("Internal server error", 500);
  }
}
