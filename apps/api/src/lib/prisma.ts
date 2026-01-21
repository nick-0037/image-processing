import { PrismaClient } from '@prisma/client';

// Esto asegura que no creamos múltiples instancias de conexión en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;