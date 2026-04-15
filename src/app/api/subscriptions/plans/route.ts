import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    return apiSuccess({ plans })
  } catch (error) {
    console.error('Get plans error:', error)
    return apiError('Internal server error', 500)
  }
}
