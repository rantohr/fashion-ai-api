import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

// Skeleton seed script for the 6-table data model (see .docs project plan).
// `business_profile` (singleton) and one ADMIN `user` are seeded here since
// both are required just to boot the auth flow. The rest are populated later
// via the admin wizards (Day 4/5) and a real content pass (Day 10) -
// upsert() keeps this safely re-runnable.
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

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@fashion-ai.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(adminPassword, SALT_ROUNDS),
    },
  });

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
