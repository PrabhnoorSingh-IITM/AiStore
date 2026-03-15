import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * Prisma Client Singleton with PG Adapter
 * Prioritizes DIRECT_URL for stable connectivity.
 */

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
