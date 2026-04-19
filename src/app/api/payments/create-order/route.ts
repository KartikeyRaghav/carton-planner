import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { razorpay, PLAN_PRICES } from "@/lib/razorpay";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";

const orderSchema = z.object({
  plan: z.enum(["half_yearly", "quarterly"]),
});

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success)
      return apiError("Validation failed", 400, parsed.error.flatten());

    const { plan } = parsed.data;
    const pricing = PLAN_PRICES[plan];

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (!user) return apiError("User not found", 404);
    console.log("Here 1");
    const order = await razorpay.orders.create({
      amount: pricing.amount,
      currency: "INR",
      receipt: `sub_${userId}_${Date.now()}`,
      notes: { userId, plan },
    });
    console.log("Here 2");

    await prisma.payment.create({
      data: {
        userId: Number(userId),
        razorpayOrderId: order.id,
        amount: pricing.amount,
        plan,
        status: "created",
      },
    });
    console.log("Here 3");

    return apiSuccess({
      orderId: order.id,
      amount: pricing.amount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan,
      userName: user.name,
      userEmail: user.email,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return apiError("Internal server error", 500);
  }
}
