import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const devices = await prisma.deviceSession.findMany({
      where: { userId: Number(userId), isActive: true },
      orderBy: { lastActive: "desc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { subscription: true },
    });

    const maxDevices = user?.subscription?.maxDevices ?? 2;

    return apiSuccess({ devices, maxDevices, currentCount: devices.length });
  } catch (error) {
    console.error("Get devices error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) return apiError("deviceId is required", 400);

    const device = await prisma.deviceSession.findFirst({
      where: { deviceId, userId: Number(userId) },
    });

    if (!device) return apiError("Device not found", 404);

    await prisma.deviceSession.update({
      where: { id: device.id },
      data: { isActive: false },
    });

    return apiSuccess({ message: "Device removed successfully" });
  } catch (error) {
    console.error("Delete device error:", error);
    return apiError("Internal server error", 500);
  }
}
