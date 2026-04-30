import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { faker } from "@faker-js/faker";
import { findOrCreateDefaultTeam } from "@/lib/services/find-or-create-default-team";
import { createActivity } from "@/lib/services/create-activity";
import { createCategory } from "@/lib/services/create-category";

const connectionString = process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create a new user with verified email
  const user = await prisma.user.create({
    data: {
      email: "foo@bar.com",
      emailVerified: new Date(),
    },
  });

  // Create the default team for the user
  const team = await findOrCreateDefaultTeam(user.id);

  if (!team) {
    throw new Error("Failed to create default team");
  }

  // Create starter categories for the user (dev/test only)
  if (process.env.NODE_ENV !== "production") {
    const STARTER_CATEGORIES = [
      "Health",
      "Work",
      "Personal",
      "Learning",
      "Hobby",
    ];
    for (const name of STARTER_CATEGORIES) {
      await createCategory({ name, userId: user.id });
    }
  }

  // Create 10 activities for the user
  for (let i = 0; i < 10; i++) {
    await createActivity({
      name: faker.lorem.words(),
      description: faker.lorem.sentence(),
      userId: user.id,
    });
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
