import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature, PLAN_PRICES } from "@/lib/razorpay";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";

const verifySchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success)
      return apiError("Validation failed", 400, parsed.error.flatten());

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      parsed.data;

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!isValid) return apiError("Invalid payment signature", 400);

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    if (!payment) return apiError("Payment record not found", 404);
    if (payment.userId !== Number(userId))
      return apiError("Unauthorized payment", 403);

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: "paid",
      },
    });

    if (payment.plan === "extra_device") {
      // Add extra device slot to subscription
      await prisma.subscription.update({
        where: { userId: Number(userId) },
        data: { maxDevices: { increment: 1 } },
      });

      return apiSuccess({ message: "Extra device slot added successfully" });
    }

    // Activate subscription
    const planKey = payment.plan as keyof typeof PLAN_PRICES;
    const pricing = PLAN_PRICES[planKey];
    if (!pricing) return apiError("Invalid plan", 400);

    const planDetails = await prisma.plan.findUnique({
      where: { name: payment.plan },
    });
    const durationDays = planDetails?.durationDays ?? pricing.duration;
    const maxDevices = planDetails?.maxDevices ?? 2;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const existingSub = await prisma.subscription.findUnique({
      where: { userId: Number(userId) },
    });

    let subscription;
    if (existingSub) {
      // Extend existing subscription
      const baseDate =
        existingSub.status === "active" && existingSub.endDate > new Date()
          ? existingSub.endDate
          : new Date();
      const extendedEnd = new Date(baseDate);
      extendedEnd.setDate(extendedEnd.getDate() + durationDays);

      subscription = await prisma.subscription.update({
        where: { userId: Number(userId) },
        data: {
          plan: payment.plan,
          status: "active",
          endDate: extendedEnd,
          maxDevices: Math.max(existingSub.maxDevices, maxDevices),
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId: Number(userId),
          plan: payment.plan,
          status: "active",
          endDate,
          maxDevices,
        },
      });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id },
    });

    return apiSuccess({
      message: "Subscription activated successfully",
      subscription,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return apiError("Internal server error", 500);
  }
}
