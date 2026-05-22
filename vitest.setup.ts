import { afterEach, afterAll, beforeAll } from "vitest";
import { prisma, pool } from "@/lib/prisma";

const DENY_LIST = new Set(["_prisma_migrations"]);

beforeAll(() => {
  const url = process.env.DATABASE_TEST_URL ?? "";
  let dbName = "";
  try {
    dbName = new URL(url).pathname.slice(1);
  } catch {
    throw new Error("DATABASE_TEST_URL is not a valid URL or is unset");
  }
  if (!dbName.toLowerCase().includes("test")) {
    throw new Error(
      `Refusing to TRUNCATE: DATABASE_TEST_URL database name must contain "test", got: "${dbName}"`
    );
  }
});

const cleanDatabase = async () => {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => !DENY_LIST.has(name))
    .sort()
    .map((name) => `"public"."${name}"`);

  if (tables.length === 0) return;

  await prisma.$transaction(
    async (tx) => {
      for (const table of tables) {
        await tx.$executeRawUnsafe(`TRUNCATE TABLE ${table} CASCADE;`);
      }
    },
    { maxWait: 5000, timeout: 10000 }
  );
};

afterEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
});
