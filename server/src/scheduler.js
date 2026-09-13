import cron from 'node-cron';
import prisma from './prismaClient.js';
import { processDueRecurringTransactions } from './utils/recurringTransactions.js';

let isRunning = false;

// Runs every 15 minutes inside the Express process. The `isRunning` flag only
// guards against overlapping ticks within this one process — cross-process
// duplicate-generation safety is provided by generateOccurrence()'s DB-level
// guard, not by this flag, so it's safe for the standalone script (run by an
// external cron/Task Scheduler) to execute concurrently with this scheduler.
export function startRecurringTransactionScheduler() {
  return cron.schedule('*/15 * * * *', async () => {
    if (isRunning) {
      console.log('[recurring-scheduler] previous tick still running, skipping');
      return;
    }
    isRunning = true;
    console.log(`[recurring-scheduler] tick started at ${new Date().toISOString()}`);
    try {
      const summary = await processDueRecurringTransactions(prisma);
      console.log(`[recurring-scheduler] tick complete: ${JSON.stringify(summary)}`);
    } catch (err) {
      console.error('[recurring-scheduler] tick failed', err);
    } finally {
      isRunning = false;
    }
  });
}
