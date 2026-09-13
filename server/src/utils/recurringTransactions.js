const DEFAULT_MAX_ITERATIONS = 366;

function addUTCDays(date, days) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + days,
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  ));
}

// Builds a UTC date for (year, month, day), clamping day to the target month's
// actual last day (handles e.g. Jan 31 -> Feb, and Feb 29 -> non-leap years).
function clampedUTCDate(year, month, day, hh, mm, ss, ms) {
  const normalized = new Date(Date.UTC(year, month, 1));
  const y = normalized.getUTCFullYear();
  const m = normalized.getUTCMonth();
  const lastDayOfMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, lastDayOfMonth), hh, mm, ss, ms));
}

// Computes the next occurrence after `occurrenceDate`, anchored to `startDate`'s
// day-of-month/month/time-of-day (not to the previous occurrence's clamped day) —
// this prevents drift, e.g. Jan 31 -> Feb 28 -> Mar 31 instead of Jan 31 -> Feb 28 -> Mar 28.
export function computeNextOccurrence(occurrenceDate, frequency, startDate) {
  const hh = startDate.getUTCHours();
  const mm = startDate.getUTCMinutes();
  const ss = startDate.getUTCSeconds();
  const ms = startDate.getUTCMilliseconds();
  const anchorDay = startDate.getUTCDate();
  const anchorMonth = startDate.getUTCMonth();

  switch (frequency) {
    case 'daily':
      return addUTCDays(occurrenceDate, 1);
    case 'weekly':
      return addUTCDays(occurrenceDate, 7);
    case 'monthly': {
      const monthsElapsed =
        (occurrenceDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
        (occurrenceDate.getUTCMonth() - startDate.getUTCMonth());
      return clampedUTCDate(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() + monthsElapsed + 1,
        anchorDay,
        hh, mm, ss, ms
      );
    }
    case 'yearly': {
      const yearsElapsed = occurrenceDate.getUTCFullYear() - startDate.getUTCFullYear();
      return clampedUTCDate(
        startDate.getUTCFullYear() + yearsElapsed + 1,
        anchorMonth,
        anchorDay,
        hh, mm, ss, ms
      );
    }
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
}

export async function getDueRecurringTransactions(prisma, now = new Date()) {
  return prisma.recurringTransaction.findMany({
    where: { status: 'active', nextExecutionDate: { lte: now } },
    orderBy: { nextExecutionDate: 'asc' },
  });
}

// Concurrency-safe generation of a single due occurrence. Uses an optimistic
// concurrency guard (conditional updateMany on the exact current nextExecutionDate)
// inside a DB transaction, backed by a unique constraint on
// RecurringTransactionLog(recurringTransactionId, occurrenceDate) as a hard backstop.
// Safe to call concurrently from multiple processes (in-process cron + standalone
// script) without ever generating a duplicate transaction for the same occurrence.
export async function generateOccurrence(prisma, ruleId, expectedOccurrenceDate, nextOccurrenceDate) {
  try {
    return await prisma.$transaction(async (tx) => {
      const claim = await tx.recurringTransaction.updateMany({
        where: {
          id: ruleId,
          status: 'active',
          nextExecutionDate: expectedOccurrenceDate,
        },
        data: { nextExecutionDate: nextOccurrenceDate },
      });

      if (claim.count === 0) {
        return { claimed: false };
      }

      // If this exact occurrence was already logged in a prior run (e.g.
      // nextExecutionDate was manually reset backward onto an already-processed
      // date), skip creating a duplicate transaction, but still let the
      // nextExecutionDate advance above commit — otherwise the rule would get
      // permanently stuck retrying the same occurrence forever.
      const existingLog = await tx.recurringTransactionLog.findUnique({
        where: {
          recurringTransactionId_occurrenceDate: {
            recurringTransactionId: ruleId,
            occurrenceDate: expectedOccurrenceDate,
          },
        },
      });
      if (existingLog) {
        return { claimed: true, alreadyLogged: true };
      }

      const rule = await tx.recurringTransaction.findUniqueOrThrow({ where: { id: ruleId } });

      const transaction = await tx.transaction.create({
        data: {
          description: rule.description,
          amount: rule.amount,
          type: rule.type,
          category: rule.category,
          date: expectedOccurrenceDate,
          userId: rule.userId,
          recurringTransactionId: rule.id,
        },
      });

      const log = await tx.recurringTransactionLog.create({
        data: {
          recurringTransactionId: rule.id,
          occurrenceDate: expectedOccurrenceDate,
          transactionId: transaction.id,
          status: 'generated',
        },
      });

      return { claimed: true, transaction, log };
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return { claimed: false, duplicate: true };
    }
    throw err;
  }
}

// Catches up all missed occurrences for a single rule, up to `now`, capped at
// `maxIterations` per run (remaining backlog resumes on the next run).
export async function processRecurringTransaction(prisma, ruleId, options = {}) {
  const { now = new Date(), maxIterations = DEFAULT_MAX_ITERATIONS } = options;
  let iterations = 0;
  let generated = 0;

  while (iterations < maxIterations) {
    const rule = await prisma.recurringTransaction.findUnique({ where: { id: ruleId } });
    if (!rule || rule.status !== 'active') break;
    if (rule.nextExecutionDate > now) break;
    if (rule.endDate && rule.nextExecutionDate > rule.endDate) break;

    const occurrenceDate = rule.nextExecutionDate;
    const nextOccurrenceDate = computeNextOccurrence(occurrenceDate, rule.frequency, rule.startDate);

    const result = await generateOccurrence(prisma, ruleId, occurrenceDate, nextOccurrenceDate);
    iterations += 1;
    if (result.claimed && !result.alreadyLogged) generated += 1;
  }

  const cappedOut = iterations >= maxIterations;
  if (cappedOut) {
    console.warn(`[recurringTransactions] rule ${ruleId} hit the ${maxIterations}-iteration safety cap; remaining backlog resumes next run.`);
  }
  return { ruleId, generated, iterations, cappedOut };
}

// Single entry point shared by the in-process scheduler and the standalone script.
export async function processDueRecurringTransactions(prisma, options = {}) {
  const { now = new Date(), maxIterationsPerRule = DEFAULT_MAX_ITERATIONS } = options;
  const dueRules = await getDueRecurringTransactions(prisma, now);
  const results = [];

  for (const rule of dueRules) {
    try {
      results.push(await processRecurringTransaction(prisma, rule.id, { now, maxIterations: maxIterationsPerRule }));
    } catch (err) {
      console.error(`[recurringTransactions] failed processing rule ${rule.id}`, err);
      results.push({ ruleId: rule.id, generated: 0, error: err.message });
    }
  }

  return {
    rulesProcessed: results.length,
    totalGenerated: results.reduce((sum, r) => sum + (r.generated || 0), 0),
    results,
  };
}
