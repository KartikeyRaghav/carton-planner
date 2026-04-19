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
  deviceName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { email, password, deviceName } = parsed.data;

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

    // Detect if this request is coming from a browser that already has an
    // inactive session (e.g. logged out and logging back in).
    // We identify this by matching User-Agent + IP — if there's an inactive
    // session from this same client, we reactivate it instead of counting
    // a brand-new slot.
    const userAgent = req.headers.get("user-agent") ?? null;
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      null;

    // Try to find an existing inactive session from this same client
    const prevSession = await prisma.deviceSession.findFirst({
      where: {
        userId: user.id,
        ...(userAgent ? { userAgent } : {}),
        ...(ipAddress ? { ipAddress } : {}),
      },
      orderBy: { lastActive: "desc" },
    });

    let deviceId: string;

    if (prevSession) {
      // Reactivate the existing session — no new slot consumed
      deviceId = prevSession.deviceId;
      await prisma.deviceSession.update({
        where: { id: prevSession.id },
        data: {
          isActive: true,
          lastActive: new Date(),
          deviceName: deviceName || prevSession.deviceName || "Device",
        },
      });
    } else {
      // Brand-new device — check limit
      if (activeDevices.length >= maxDevices) {
        return apiError(
          `Device limit reached (${activeDevices.length}/${maxDevices}). Please log out from another device or purchase an extra device slot.`,
          403,
          {
            deviceLimitExceeded: true,
            currentDevices: activeDevices.length,
            maxDevices,
          },
        );
      }

      deviceId = uuidv4();
      await prisma.deviceSession.create({
        data: {
          userId: user.id,
          deviceId,
          deviceName: deviceName || `Device ${activeDevices.length + 1}`,
          userAgent,
          ipAddress,
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email, deviceId });

    // Return user without sensitive fields
    const {
      passwordHash: _ph,
      devices: _dv,
      subscription: _sub,
      ...safeUser
    } = user;
    const response = apiSuccess({ user: safeUser, token });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return apiError("Internal server error", 500);
  }
}
