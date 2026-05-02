import { PrismaClient } from '@prisma/client';

const CHECK_INTERVAL_MS = 60_000; // run scheduler every 60s

export async function startUptimeMonitor(prisma: PrismaClient) {
  console.log('[Uptime] Monitor started');

  async function runChecks() {
    try {
      const now = new Date();

      const checks = await prisma.uptimeCheck.findMany({
        where: { enabled: true },
      });

      for (const check of checks) {
        const nextCheckDue = check.lastCheckedAt
          ? new Date(check.lastCheckedAt.getTime() + check.intervalMins * 60_000)
          : new Date(0);

        if (now < nextCheckDue) continue;

        performCheck(prisma, check);
      }
    } catch (err) {
      console.error('[Uptime] Scheduler error:', err);
    }
  }

  setInterval(runChecks, CHECK_INTERVAL_MS);
  runChecks();
}

async function performCheck(prisma: PrismaClient, check: any) {
  const start = Date.now();
  let status: 'UP' | 'DOWN' = 'DOWN';
  let statusCode: number | null = null;
  let error: string | null = null;
  let responseTime: number | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(check.url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);
    responseTime = Date.now() - start;
    statusCode   = res.status;
    status       = res.ok ? 'UP' : 'DOWN';
  } catch (err: any) {
    responseTime = Date.now() - start;
    error        = err.message || 'Request failed';
    status       = 'DOWN';
  }

  // Save result
  await prisma.uptimeResult.create({
    data: { checkId: check.id, status, responseTime, statusCode, error },
  });

  // Update check status
  const prevStatus = check.lastStatus;
  await prisma.uptimeCheck.update({
    where: { id: check.id },
    data: { lastStatus: status, lastCheckedAt: new Date() },
  });

  // Log status changes
  if (prevStatus !== status && prevStatus !== 'UNKNOWN') {
    if (status === 'DOWN') {
      console.warn(`[Uptime] 🔴 DOWN: ${check.url}`);
    } else {
      console.log(`[Uptime] 🟢 UP: ${check.url} (${responseTime}ms)`);
    }

    // Fire webhook alerts if configured
    await fireAlerts(prisma, check, status);
  }
}

async function fireAlerts(prisma: PrismaClient, check: any, status: 'UP' | 'DOWN') {
  try {
    const alertType = status === 'DOWN' ? 'UPTIME_DOWN' : 'UPTIME_UP';

    const alerts = await prisma.alert.findMany({
      where: { websiteId: check.websiteId, type: alertType, enabled: true },
    });

    for (const alert of alerts) {
      if (alert.webhookUrl) {
        try {
          await fetch(alert.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: alertType,
              url: check.url,
              status,
              timestamp: new Date().toISOString(),
            }),
          });
          await prisma.alert.update({
            where: { id: alert.id },
            data: { lastFiredAt: new Date() },
          });
        } catch (webhookErr) {
          console.error('[Uptime] Webhook failed:', webhookErr);
        }
      }
    }
  } catch (err) {
    console.error('[Uptime] Alert firing error:', err);
  }
}
