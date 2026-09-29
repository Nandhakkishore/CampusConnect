import { PrismaClient } from '@prisma/client';
import { mockPrisma } from './mockDb';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const realPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = realPrisma;
}

export default process.env.USE_MOCK_DB === 'true' ? (mockPrisma as any) : realPrisma;
