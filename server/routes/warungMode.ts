import { Router } from 'express';
import { enforceRole } from '../middleware/roleGuard';
import { WarungModeService } from '../services/warungModeService';

const router = Router();

router.post('/warung-mode/parse-voice', enforceRole('edit'), async (req, res) => {
  try {
    const businessId = req.businessId as string | undefined;
    if (!businessId) return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    const transcript = String(req.body?.transcript || '');
    const parsed = await WarungModeService.parseVoiceTranscript(businessId, transcript);
    return res.json({ success: true, ...parsed });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, status: 'failed', items: [], warnings: [], error: err.message || 'Gagal parsing voice transaksi.' });
  }
});

router.post('/warung-mode/save-transaction', enforceRole('edit'), async (req, res) => {
  try {
    const businessId = req.businessId as string | undefined;
    if (!businessId) return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    const idempotencyKey = String(req.headers['x-idempotency-key'] || req.body?.idempotency_key || '');
    const saved = await WarungModeService.saveTransaction({
      businessId,
      transcript: String(req.body?.transcript || ''),
      items: Array.isArray(req.body?.items) ? req.body.items : [],
      validationStatus: req.body?.status === 'ok' || req.body?.status === 'partial' ? req.body.status : 'partial',
      idempotencyKey: idempotencyKey || undefined,
    });
    return res.json({ success: true, data: saved });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal menyimpan transaksi voice.' });
  }
});

export default router;
