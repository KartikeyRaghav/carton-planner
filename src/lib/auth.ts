import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from './jwt'
import { prisma } from './prisma'

export async function getAuthUser(req?: NextRequest): Promise<JWTPayload | null> {
  let token: string | null = null

  if (req) {
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    if (!token) {
      token = req.cookies.get('auth_token')?.value || null
    }
  } else {
    const cookieStore = cookies()
    token = cookieStore.get('auth_token')?.value || null
  }

  if (!token) return null
  return verifyToken(token)
}

export async function checkSubscriptionAccess(userId: string): Promise<{
  hasAccess: boolean
  reason: string
  trialEndsAt?: Date
  subscriptionEndsAt?: Date
}> {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: { subscription: true },
  })

  if (!user) return { hasAccess: false, reason: 'User not found' }

  const now = new Date()

  // Check active subscription first
  if (user.subscription && user.subscription.status === 'active' && user.subscription.endDate > now) {
    return {
      hasAccess: true,
      reason: 'Active subscription',
      subscriptionEndsAt: user.subscription.endDate,
    }
  }

  // Check trial
  if (user.trialEndsAt > now) {
    return {
      hasAccess: true,
      reason: 'Trial active',
      trialEndsAt: user.trialEndsAt,
    }
  }

  return { hasAccess: false, reason: 'No active subscription or trial' }
}

export async function checkDeviceLimit(userId: string, deviceId: string): Promise<{
  allowed: boolean
  currentCount: number
  maxDevices: number
  reason?: string
}> {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: {
      subscription: true,
      devices: { where: { isActive: true } },
    },
  })

  if (!user) return { allowed: false, currentCount: 0, maxDevices: 0, reason: 'User not found' }

  const maxDevices = user.subscription?.maxDevices ?? 2
  const activeDevices = user.devices

  // If this device already has a session, allow it
  const existingDevice = activeDevices.find(d => d.deviceId === deviceId)
  if (existingDevice) {
    return { allowed: true, currentCount: activeDevices.length, maxDevices }
  }

  if (activeDevices.length >= maxDevices) {
    return {
      allowed: false,
      currentCount: activeDevices.length,
      maxDevices,
      reason: `Device limit reached (${activeDevices.length}/${maxDevices})`,
    }
  }

  return { allowed: true, currentCount: activeDevices.length, maxDevices }
}
