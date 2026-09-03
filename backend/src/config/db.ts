import { PrismaClient } from '@prisma/client';
import { mockPrisma } from '../../tests/mockDb';

const realPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Proxy that falls back to in-memory mock during testing if DB is unreachable
const prismaProxy = new Proxy(realPrisma, {
  get(target: any, prop: string) {
    if (process.env.USE_MOCK_DB === 'true') {
      return (mockPrisma as any)[prop] || target[prop];
    }
    return target[prop];
  },
});

export default process.env.USE_MOCK_DB === 'true' ? (mockPrisma as any) : realPrisma;
