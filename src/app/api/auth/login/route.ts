import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { apiSuccess, apiError } from "@/lib/api-response";
import { v4 as uuidv4 } from "uuid";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  localStorageDeviceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(body);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { email, password, localStorageDeviceId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
        devices: {},
      },
    });

    if (!user) return apiError("Invalid credentials", 401);

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return apiError("Invalid credentials", 401);

    const maxDevices = user.subscription?.maxDevices ?? 2;
    const activeDevices = user.devices;

    let deviceId: string | undefined;

    const incomingDeviceId =
      req.cookies.get("device_id")?.value || localStorageDeviceId;

    let existingSession = null;

    if (incomingDeviceId) {
      existingSession = await prisma.deviceSession.findFirst({
        where: {
          userId: user.id,
          deviceId: incomingDeviceId,
        },
        orderBy: { lastActive: "desc" },
      });
    }

    if (existingSession) {
      await prisma.deviceSession.update({
        where: { id: existingSession.id },
        data: {
          isActive: true,
          lastActive: new Date(),
        },
      });
      deviceId = existingSession.deviceId;
    } else {
      if (activeDevices.length >= maxDevices) {
        return apiError(
          `Device limit reached (${activeDevices.length}/${maxDevices}). Purchase an extra device slot.`,
          403,
          {
            deviceLimitExceeded: true,
            currentDevices: activeDevices.length,
            maxDevices,
          },
        );
      }

      const newDeviceId = uuidv4();

      await prisma.deviceSession.create({
        data: {
          userId: user.id,
          deviceId: newDeviceId,
          deviceName: `Device ${activeDevices.length + 1}`,
          userAgent: req.headers.get("user-agent") || "",
          ipAddress: req.ip || "",
          isActive: true,
          lastActive: new Date(),
        },
      });

      deviceId = newDeviceId;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      deviceId: deviceId!,
    });

    const {
      passwordHash: _ph,
      devices: _dv,
      subscription: _sub,
      ...safeUser
    } = user;
    const response = apiSuccess({ user: safeUser, token, deviceId });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.set("device_id", deviceId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return apiError("Internal server error", 500);
  }
}
