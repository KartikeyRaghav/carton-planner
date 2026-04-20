import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.plan.upsert({
    where: { name: 'quarterly' },
    update: {},
    create: {
      name: 'monthly',
      displayName: '3 Month',
      durationDays: 90,
      price: 109900,
      maxDevices: 2,
      features: ['Full calculator access', 'Calculation history', 'Up to 2 devices', 'Email support'],
    },
  })

  await prisma.plan.upsert({
    where: { name: 'half_yearly' },
    update: {},
    create: {
      name: 'quarterly',
      displayName: '6 Months',
      durationDays: 180,
      price: 199900,
      maxDevices: 2,
      features: ['Full calculator access', 'Calculation history', 'Up to 2 devices', 'Priority support'],
    },
  })

  // await prisma.plan.upsert({
  //   where: { name: 'yearly' },
  //   update: {},
  //   create: {
  //     name: 'yearly',
  //     displayName: '1 Year',
  //     durationDays: 365,
  //     price: 699900,
  //     maxDevices: 3,
  //     features: ['Full calculator access', 'Calculation history', 'Up to 3 devices', 'Priority support'],
  //   },
  // })

  console.log('Plans seeded successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
