import { PrismaClient } from '@prisma/client';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // run once per day

export async function startRetentionCron(prisma: PrismaClient) {
  console.log('[Retention] Started');

  async function runCleanup() {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, dataRetentionDays: true, websites: { select: { id: true } } },
      });

      for (const user of users) {
        const days = user.dataRetentionDays;
        if (!days || days <= 0) continue; // keep forever

        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const websiteIds = user.websites.map(w => w.id);

        if (websiteIds.length === 0) continue;

        const [deletedPv, deletedEvents, deletedSessions] = await Promise.all([
          prisma.pageView.deleteMany({
            where: { websiteId: { in: websiteIds }, timestamp: { lt: cutoff } },
          }),
          prisma.event.deleteMany({
            where: { websiteId: { in: websiteIds }, timestamp: { lt: cutoff } },
          }),
          prisma.session.deleteMany({
            where: { websiteId: { in: websiteIds }, startTime: { lt: cutoff } },
          }),
        ]);

        if (deletedPv.count > 0 || deletedEvents.count > 0 || deletedSessions.count > 0) {
          console.log(
            `[Retention] User ${user.id}: deleted ${deletedPv.count} pageviews, ${deletedEvents.count} events, ${deletedSessions.count} sessions older than ${days} days`
          );
        }
      }
    } catch (err) {
      console.error('[Retention] Cleanup error:', err);
    }
  }

  // Run on start, then daily
  runCleanup();
  setInterval(runCleanup, CHECK_INTERVAL_MS);
}
