import { PrismaClient } from '@prisma/client';

const CHECK_INTERVAL_MS = 5 * 60_000; // check every 5 minutes

export async function startTrafficMonitor(prisma: PrismaClient) {
  console.log('[TrafficMonitor] Started');

  async function runChecks() {
    try {
      const alerts = await prisma.alert.findMany({
        where: { type: { in: ['TRAFFIC_SPIKE', 'TRAFFIC_DROP'] }, enabled: true },
      });
      for (const alert of alerts) {
        await checkTrafficAlert(prisma, alert);
      }
    } catch (err) {
      console.error('[TrafficMonitor] Error:', err);
    }
  }

  setInterval(runChecks, CHECK_INTERVAL_MS);
  runChecks();
}

async function checkTrafficAlert(prisma: PrismaClient, alert: any) {
  try {
    const now = new Date();

    // Cooldown: don't fire again within the same window period to avoid spam
    if (alert.lastFiredAt) {
      const cooldownMs = alert.windowHours * 60 * 60 * 1000;
      const elapsed = now.getTime() - new Date(alert.lastFiredAt).getTime();
      if (elapsed < cooldownMs) return;
    }

    const windowStart = new Date(now.getTime() - alert.windowHours * 60 * 60 * 1000);
    const visits = await prisma.session.count({
      where: { websiteId: alert.websiteId, startTime: { gte: windowStart } },
    });

    const triggered =
      (alert.type === 'TRAFFIC_SPIKE' && alert.condition === 'ABOVE' && visits > alert.threshold) ||
      (alert.type === 'TRAFFIC_DROP'  && alert.condition === 'BELOW' && visits < alert.threshold);

    if (!triggered) return;

    console.log(`[TrafficMonitor] Alert "${alert.name}" triggered — ${visits} visits in last ${alert.windowHours}h (threshold: ${alert.threshold})`);

    // Update lastFiredAt first to prevent double-firing
    await prisma.alert.update({
      where: { id: alert.id },
      data: { lastFiredAt: now },
    });

    if (alert.webhookUrl) {
      try {
        await fetch(alert.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: alert.type,
            alertName: alert.name,
            websiteId: alert.websiteId,
            visits,
            threshold: alert.threshold,
            windowHours: alert.windowHours,
            timestamp: now.toISOString(),
          }),
        });
      } catch (err) {
        console.error('[TrafficMonitor] Webhook failed:', err);
      }
    }
  } catch (err) {
    console.error('[TrafficMonitor] Check error:', err);
  }
}
