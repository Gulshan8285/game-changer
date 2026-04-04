import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaUrl: string | undefined
}

const currentDatabaseUrl = process.env.DATABASE_URL || ''
const hasMatchingClient =
  globalForPrisma.prisma && globalForPrisma.prismaUrl === currentDatabaseUrl

if (globalForPrisma.prisma && !hasMatchingClient) {
  void globalForPrisma.prisma.$disconnect().catch(() => {})
}

export const db =
  hasMatchingClient
    ? globalForPrisma.prisma
    : new PrismaClient({
        log: ['error'],
      })

globalForPrisma.prisma = db
globalForPrisma.prismaUrl = currentDatabaseUrl
