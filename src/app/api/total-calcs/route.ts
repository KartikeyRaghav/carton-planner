import { apiError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const [total1, total2] = await Promise.all([
      prisma.calculation.count({ where: { userId: Number(userId) } }),
      prisma.monoCartonCalculation.count({ where: { userId: Number(userId) } }),
    ]);


    return apiSuccess({
      total: total1 + total2,
    });
  } catch (error) {
    console.error("Total calculations error:", error);
    return apiError("Internal server error", 500);
  }
}
