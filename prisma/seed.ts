import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.NEON_DATABASE_URL,
    process.env.POSTGRES_URL,
  ]

  return (
    candidates.find((value) => value && /^(postgres|postgresql):\/\//.test(value)) || ''
  )
}

const databaseUrl = resolveDatabaseUrl()
const db = databaseUrl
  ? new PrismaClient({
      adapter: new PrismaNeon({ connectionString: databaseUrl }),
    })
  : new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create default admin account
  const existingAdmin = await db.adminAuth.findUnique({
    where: { username: 'admin' },
  })

  if (!existingAdmin) {
    await db.adminAuth.create({
      data: {
        username: 'admin',
        password: 'admin123',
      },
    })
    console.log('✅ Admin account created (admin / admin123)')
  } else {
    console.log('⏭️  Admin account already exists, skipping...')
  }

  // 2. Create default investment plans
  const existingPlans = await db.investmentPlan.count()
  if (existingPlans === 0) {
    await db.investmentPlan.createMany({
      data: [
        {
          name: 'Basic',
          price: 5000,
          daily: 300,
          monthly: 9000,
          totalReturn: 14000,
          color: 'bg-emerald-500',
          iconBg: 'bg-emerald-500/20',
          iconColor: 'text-emerald-400',
          sortOrder: 0,
        },
        {
          name: 'Standard',
          price: 8000,
          daily: 700,
          monthly: 21000,
          totalReturn: 29000,
          color: 'bg-amber-500',
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-400',
          sortOrder: 1,
        },
        {
          name: 'Premium',
          price: 10000,
          daily: 1500,
          monthly: 45000,
          totalReturn: 55000,
          color: 'bg-purple-500',
          iconBg: 'bg-purple-500/20',
          iconColor: 'text-purple-400',
          sortOrder: 2,
        },
      ],
    })
    console.log('✅ 3 investment plans created')
  } else {
    console.log('⏭️  Investment plans already exist, skipping...')
  }

  // 3. Create default site content entries
  const contentKeys = [
    'hero_title',
    'hero_subtitle',
    'support_email',
    'support_whatsapp',
    'about_text',
    'terms_text',
  ]

  for (const key of contentKeys) {
    const existing = await db.siteContent.findUnique({ where: { key } })
    if (!existing) {
      await db.siteContent.create({
        data: { key, value: '' },
      })
    }
  }
  console.log('✅ Site content entries created')

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
