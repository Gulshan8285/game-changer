import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaUrl: string | undefined
}

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

const currentDatabaseUrl = resolveDatabaseUrl()
const hasMatchingClient =
  globalForPrisma.prisma && globalForPrisma.prismaUrl === currentDatabaseUrl

if (globalForPrisma.prisma && !hasMatchingClient) {
  void globalForPrisma.prisma.$disconnect().catch(() => {})
}

function createClient() {
  if (currentDatabaseUrl) {
    const adapter = new PrismaNeon({
      connectionString: currentDatabaseUrl,
    })

    return new PrismaClient({
      adapter,
      log: ['error'],
    })
  }

  return new PrismaClient({
    log: ['error'],
  })
}

export const db =
  hasMatchingClient
    ? globalForPrisma.prisma
    : createClient()

globalForPrisma.prisma = db
globalForPrisma.prismaUrl = currentDatabaseUrl
