import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

export interface PlanPricing {
  quarterly: { amount: number; display: string; duration: number };
  half_yearly: { amount: number; display: string; duration: number };
  // yearly: { amount: number; display: string; duration: number }
}

export const PLAN_PRICES: PlanPricing = {
  quarterly: { amount: 129900, display: "₹1299", duration: 90 },
  half_yearly: { amount: 229900, display: "₹2,299", duration: 180 },
  // yearly:   { amount: 399900, display: '₹3,999',  duration: 365 },
};

export const EXTRA_DEVICE_PRICE = parseInt(
  process.env.EXTRA_DEVICE_PRICE || "74900",
  10,
);
