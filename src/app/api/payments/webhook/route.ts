import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, PLAN_PRICES } from '@/lib/razorpay'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) return apiError('Missing signature', 400)

    // Verify webhook signature
    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(body, signature)
      if (!isValid) return apiError('Invalid webhook signature', 400)
    }

    const event = JSON.parse(body)
    const { event: eventType, payload } = event

    if (eventType === 'payment.captured') {
      const payment = payload.payment.entity
      const orderId = payment.order_id
      const paymentId = payment.id

      const paymentRecord = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
      })

      if (!paymentRecord || paymentRecord.status === 'paid') {
        return apiSuccess({ message: 'Already processed or not found' })
      }

      await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { razorpayPaymentId: paymentId, status: 'paid' },
      })

      if (paymentRecord.plan !== 'extra_device') {
        const planKey = paymentRecord.plan as keyof typeof PLAN_PRICES
        const planDetails = await prisma.plan.findUnique({ where: { name: paymentRecord.plan } })
        const durationDays = planDetails?.durationDays ?? PLAN_PRICES[planKey]?.duration ?? 30
        const maxDevices = planDetails?.maxDevices ?? 2

        const endDate = new Date()
        endDate.setDate(endDate.getDate() + durationDays)

        const existingSub = await prisma.subscription.findUnique({
          where: { userId: paymentRecord.userId },
        })

        if (existingSub) {
          await prisma.subscription.update({
            where: { userId: paymentRecord.userId },
            data: { plan: paymentRecord.plan, status: 'active', endDate, maxDevices },
          })
        } else {
          const sub = await prisma.subscription.create({
            data: {
              userId: paymentRecord.userId,
              plan: paymentRecord.plan,
              status: 'active',
              endDate,
              maxDevices,
            },
          })
          await prisma.payment.update({
            where: { razorpayOrderId: orderId },
            data: { subscriptionId: sub.id },
          })
        }
      } else {
        await prisma.subscription.update({
          where: { userId: paymentRecord.userId },
          data: { maxDevices: { increment: 1 } },
        })
      }
    }

    if (eventType === 'payment.failed') {
      const payment = payload.payment.entity
      await prisma.payment.updateMany({
        where: { razorpayOrderId: payment.order_id },
        data: { status: 'failed' },
      })
    }

    return apiSuccess({ message: 'Webhook processed' })
  } catch (error) {
    console.error('Webhook error:', error)
    return apiError('Webhook processing failed', 500)
  }
}
