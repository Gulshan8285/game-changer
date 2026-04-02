import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force fresh client to pick up schema changes
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

globalForPrisma.prisma = db
