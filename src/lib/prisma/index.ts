import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === "test") {
    return process.env.DATABASE_TEST_URL;
  }

  return process.env.DATABASE_URL;
};

const connectionString = getDatabaseUrl();
export const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
