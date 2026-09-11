import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Skeleton seed script for the 6-table data model (see .docs project plan).
// Only `business_profile` is seeded here since it's a required singleton with
// no dependencies. The rest are populated later via the admin wizards (Day 4/5)
// and a real content pass (Day 10) - upsert() keeps this safely re-runnable.
async function main() {
  await prisma.businessProfile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      shopName: 'Fashion AI Showcase',
      monthlyRevenue: 0,
      monthlyCosts: 0,
      monthlyCustomers: 0,
      monthlySalesVolume: 0,
      marketingBudget: 0,
    },
  });

  // TODO(Day 2/3): seed one ADMIN user once the auth module decides on a
  // password hashing strategy (bcrypt/argon2) for `passwordHash`.
  // TODO(Day 4): seed `brands` + `outfits` via the outfit wizard's batch-create.
  // TODO(Day 5): seed `articles` via the article wizard.
  // TODO(Day 10): replace placeholder content with a real demo content pass.
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
