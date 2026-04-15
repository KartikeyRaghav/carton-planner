import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { apiSuccess } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    // Logout is intentionally public (no middleware injection).
    // Read the cookie directly and verify it ourselves.
    const token = req.cookies.get("auth_token")?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        // Deactivate just this device session
        await prisma.deviceSession.updateMany({
          where: {
            deviceId: payload.deviceId,
            userId: payload.userId,
          },
          data: { isActive: false },
        });
      }
    }
  } catch {
    // Swallow DB errors — we always clear the cookie
  }

  const response = apiSuccess({ message: "Logged out successfully" });
  // Clear the cookie unconditionally
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
