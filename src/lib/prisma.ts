import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var prismaClientSingleton: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prismaClientSingleton ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClientSingleton = prisma;
}
