import { PrismaClient } from '@prisma/client'

// Avoid creating a new PrismaClient on every hot-reload in development.
const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
