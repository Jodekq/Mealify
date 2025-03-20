// lib/prismaClient.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Add connection error handling
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to database');
  })
  .catch((e) => {
    console.error('Failed to connect to database:', e);
  });

// Add middleware for handling connection errors
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error: any) {
    if (error?.message?.includes('prepared statement')) {
      console.log('Retrying query due to prepared statement error');
      return next(params);
    }
    throw error;
  }
});

// Add shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;