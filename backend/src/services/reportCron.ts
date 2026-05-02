import { PrismaClient } from '@prisma/client';
import { sendWeeklyReport, sendMonthlyReport } from './email.js';

export async function startReportCron(prisma: PrismaClient) {
  console.log('[Reports] Cron started');

  async function sendWeekly() {
    try {
      const users = await prisma.user.findMany({
        where: { weeklyReports: true, approved: true, emailVerified: true },
      });
      for (const user of users) {
        try { await sendWeeklyReport(user.email, user.id, prisma); }
        catch (err) { console.error(`[Reports] Weekly failed for ${user.email}:`, err); }
      }
      console.log(`[Reports] Weekly sent to ${users.length} user(s)`);
    } catch (err) {
      console.error('[Reports] Weekly cron error:', err);
    }
  }

  async function sendMonthly() {
    try {
      const users = await prisma.user.findMany({
        where: { monthlyReports: true, approved: true, emailVerified: true },
      });
      for (const user of users) {
        try { await sendMonthlyReport(user.email, user.id, prisma); }
        catch (err) { console.error(`[Reports] Monthly failed for ${user.email}:`, err); }
      }
      console.log(`[Reports] Monthly sent to ${users.length} user(s)`);
    } catch (err) {
      console.error('[Reports] Monthly cron error:', err);
    }
  }

  // Schedule weekly: every 7 days (first run after 7 days, not immediately)
  setInterval(sendWeekly, 7 * 24 * 60 * 60 * 1000);

  // Schedule monthly: every 30 days
  setInterval(sendMonthly, 30 * 24 * 60 * 60 * 1000);
}
