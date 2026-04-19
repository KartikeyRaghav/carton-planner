import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateCarton } from "@/lib/carton-calculator";
import { checkSubscriptionAccess } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
} from "@/lib/api-response";

const calcSchema = z.object({
  unit: z.enum(["mm", "inches"]),
  cartonStyle: z.enum(["Self Lock", "Both Side Tuck"]),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  pastingFlap: z.number().positive(),
  tuckInFlap: z.number().positive(),
  lockBottomMargin: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const access = await checkSubscriptionAccess(userId);
    if (!access.hasAccess) {
      return apiForbidden(
        `Access denied: ${access.reason}. Please subscribe to continue.`,
      );
    }

    const body = await req.json();
    const parsed = calcSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const result = calculateCarton(parsed.data);

    const calculation = await prisma.calculation.create({
      data: {
        userId: Number(userId),
        unit: result.unit,
        cartonStyle: parsed.data.cartonStyle,
        length: parsed.data.length,
        width: parsed.data.width,
        height: parsed.data.height,
        pastingFlap: parsed.data.pastingFlap,
        tuckInFlap: parsed.data.tuckInFlap,
        lockBottomMargin: parsed.data.lockBottomMargin,
        results: result.layouts as any,
      },
    });

    // Update device last_active
    const deviceId = req.headers.get("x-device-id");
    if (deviceId) {
      await prisma.deviceSession.updateMany({
        where: { deviceId, userId: Number(userId) },
        data: { lastActive: new Date() },
      });
    }

    return apiSuccess(
      { calculation: { ...calculation, results: result.layouts } },
      201,
    );
  } catch (error) {
    console.error("Calculate error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const skip = (page - 1) * limit;

    const [calculations, total] = await Promise.all([
      prisma.calculation.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.calculation.count({ where: { userId: Number(userId) } }),
    ]);

    return apiSuccess({
      calculations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get calculations error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    if (!searchParams.get("id")) return apiError("ID not found");
    const id = parseInt(searchParams.get("id")!);

    await prisma.calculation.delete({
      where: { userId: Number(userId), id: id },
    });

    return apiSuccess({ message: "Deleted" });
  } catch (error) {
    console.error("Get calculations error:", error);
    return apiError("Internal server error", 500);
  }
}
