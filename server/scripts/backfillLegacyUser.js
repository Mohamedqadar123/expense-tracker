import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const LEGACY_EMAIL = 'mohamedqadar1918@gmail.com';
const LEGACY_PASSWORD = 'LegacyImport123!';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: LEGACY_EMAIL } });
  if (existing) {
    console.log(`User ${LEGACY_EMAIL} already exists (id ${existing.id}) — skipping creation.`);
    return backfill(existing.id);
  }

  const passwordHash = await bcrypt.hash(LEGACY_PASSWORD, 10);
  const user = await prisma.user.create({
    data: { email: LEGACY_EMAIL, passwordHash, name: 'Mohamed Qadar' },
  });

  console.log(`Created legacy user: ${LEGACY_EMAIL} / ${LEGACY_PASSWORD}`);
  await backfill(user.id);
}

async function backfill(userId) {
  const txResult = await prisma.transaction.updateMany({
    where: { userId: null },
    data: { userId },
  });
  const goalResult = await prisma.savingsGoal.updateMany({
    where: { userId: null },
    data: { userId },
  });

  const budgets = await prisma.budget.findMany({ where: { userId: null } });
  for (const b of budgets) {
    const created = b.createdAt;
    const startDate = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), 1));
    const endDate = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth() + 1, 0));
    await prisma.budget.update({
      where: { id: b.id },
      data: {
        userId,
        name: `${b.category.charAt(0).toUpperCase()}${b.category.slice(1)} Budget`,
        amount: b.monthlyLimit,
        period: 'monthly',
        category: b.category.charAt(0).toUpperCase() + b.category.slice(1),
        startDate,
        endDate,
      },
    });
  }

  console.log(`Backfilled: ${txResult.count} transaction(s), ${goalResult.count} savings goal(s), ${budgets.length} budget(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
