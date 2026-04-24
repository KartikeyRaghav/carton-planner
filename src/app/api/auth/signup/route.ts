import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { apiSuccess, apiError } from "@/lib/api-response";
import { v4 as uuidv4 } from "uuid";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().regex(/^[0-9]{10}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { name, email, password, mobile } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError("Email already in use", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const deviceId = uuidv4();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        mobile,
        trialEndsAt,
        devices: {
          create: {
            deviceId,
            deviceName: "First Device",
            userAgent: req.headers.get("user-agent") || "",
            ipAddress: req.ip || "",
            isActive: true,
            lastActive: new Date(),
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: user.id, email: user.email, deviceId });

    const response = apiSuccess({ user, token, deviceId }, 201);
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    response.cookies.set("device_id", deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return apiError("Internal server error", 500);
  }
}
