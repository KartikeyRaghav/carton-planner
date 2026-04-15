import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay, EXTRA_DEVICE_PRICE } from "@/lib/razorpay";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
} from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { subscription: true },
    });

    if (!user) return apiError("User not found", 404);
    if (!user.subscription || user.subscription.status !== "active") {
      return apiForbidden(
        "You must have an active subscription to purchase extra device slots.",
      );
    }

    const order = await razorpay.orders.create({
      amount: EXTRA_DEVICE_PRICE,
      currency: "INR",
      receipt: `device_${userId}_${Date.now()}`,
      notes: { userId, type: "extra_device" },
    });

    await prisma.payment.create({
      data: {
        userId: Number(userId),
        subscriptionId: user.subscription.id,
        razorpayOrderId: order.id,
        amount: EXTRA_DEVICE_PRICE,
        plan: "extra_device",
        extraDevices: 1,
        status: "created",
      },
    });

    return apiSuccess({
      orderId: order.id,
      amount: EXTRA_DEVICE_PRICE,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Purchase device error:", error);
    return apiError("Internal server error", 500);
  }
}
