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

// Enhanced middleware for handling connection errors
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error: any) {
    // Check for different types of prepared statement errors
    if (
      error?.message?.includes('prepared statement') || 
      (error?.code === '26000') ||
      (error?.message?.includes('does not exist')) ||
      (error?.meta?.cause?.includes('prepared statement'))
    ) {
      console.log('Retrying query due to prepared statement error:', params.model, params.action);
      // Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Retry the query
      return next(params);
    }
    throw error;
  }
});

// Add ping functionality to keep connections alive
const pingDatabase = async () => {
  try {
    // Simple query to keep the connection alive
    await prisma.$executeRaw`SELECT 1`;
    console.log('Database ping successful');
  } catch (error) {
    console.error('Database ping failed:', error);
    // Attempt to reconnect
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log('Database reconnection successful');
    } catch (reconnectError) {
      console.error('Database reconnection failed:', reconnectError);
    }
  }
};

// Ping the database every 5 minutes to keep connections alive
if (process.env.NODE_ENV === 'production') {
  setInterval(pingDatabase, 5 * 60 * 1000);
}

// Add shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;