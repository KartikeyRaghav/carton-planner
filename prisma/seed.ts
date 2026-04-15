import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.plan.upsert({
    where: { name: 'monthly' },
    update: {},
    create: {
      name: 'monthly',
      displayName: '1 Month',
      durationDays: 30,
      price: 99900,
      maxDevices: 2,
      features: ['Full calculator access', 'Calculation history', 'Up to 2 devices', 'Email support'],
    },
  })

  await prisma.plan.upsert({
    where: { name: 'quarterly' },
    update: {},
    create: {
      name: 'quarterly',
      displayName: '3 Months',
      durationDays: 90,
      price: 249900,
      maxDevices: 2,
      features: ['Full calculator access', 'Calculation history', 'Up to 2 devices', 'Priority support'],
    },
  })

  await prisma.plan.upsert({
    where: { name: 'yearly' },
    update: {},
    create: {
      name: 'yearly',
      displayName: '1 Year',
      durationDays: 365,
      price: 699900,
      maxDevices: 3,
      features: ['Full calculator access', 'Calculation history', 'Up to 3 devices', 'Priority support'],
    },
  })

  console.log('Plans seeded successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
