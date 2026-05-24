import { Router } from 'express';
import { PassiveIntelligenceRunner } from '../jobs/passiveIntelligenceRunner';
import { WhatsAppAssistantService } from '../services/whatsappAssistantService';

const router = Router();

function assertCronSecret(req: any): void {
  const expected = process.env.CRON_SECRET;
  const actual = String(req.headers['x-cron-secret'] || '');

  if (!expected || expected.trim() === '') {
    throw Object.assign(new Error('Cron secret belum dikonfigurasi.'), { status: 503, code: 'CRON_SECRET_NOT_CONFIGURED' });
  }
  if (actual !== expected) {
    throw Object.assign(new Error('Akses internal job ditolak.'), { status: 403, code: 'CRON_SECRET_INVALID' });
  }
}

router.post('/internal/jobs/passive-intelligence', async (req, res) => {
  try {
    assertCronSecret(req);

    const now = Date.now();
    const minCooldownMs = 30_000;
    const last = PassiveIntelligenceRunner.getLastRunStartedAt();
    if (PassiveIntelligenceRunner.isRunning() || (last > 0 && now - last < minCooldownMs)) {
      return res.status(429).json({
        success: false,
        code: 'JOB_ALREADY_RUNNING',
        error: 'Job sedang berjalan atau baru saja dijalankan.',
      });
    }

    const result = await PassiveIntelligenceRunner.runAllBusinesses();

    return res.json({
      success: true,
      message: 'Passive intelligence job selesai diproses.',
      summary: result,
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({
      success: false,
      code: err.code,
      error: err.message || 'Gagal menjalankan internal passive intelligence job.',
    });
  }
});

export default router;

router.post('/internal/jobs/whatsapp-cleanup', async (req, res) => {
  try {
    assertCronSecret(req);
    const expired = await WhatsAppAssistantService.cleanupExpiredPendingActions();
    return res.json({ success: true, expired });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, code: err.code, error: err.message || 'Gagal cleanup pending action WhatsApp.' });
  }
});
