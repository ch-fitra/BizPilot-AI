import { Router } from 'express';
import { enforceRole } from '../middleware/roleGuard';
import { PassiveIntelligenceService } from '../services/passiveIntelligenceService';

const router = Router();

router.post('/passive-intelligence/run', enforceRole('edit'), async (req, res) => {
  try {
    const businessId = (req as any).businessId || null;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    }

    const result = await PassiveIntelligenceService.runForBusiness(businessId);
    return res.json({
      success: true,
      message: 'Analisis pasif berhasil dijalankan.',
      ...result,
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal menjalankan analisis pasif.' });
  }
});

router.get('/passive-intelligence/alerts', async (req, res) => {
  try {
    const businessId = (req as any).businessId || null;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    }

    const alerts = await PassiveIntelligenceService.getActiveAlerts(businessId);
    return res.json({ success: true, alerts });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal mengambil alert.' });
  }
});

router.patch('/passive-intelligence/alerts/:id/resolve', enforceRole('edit'), async (req, res) => {
  try {
    const businessId = (req as any).businessId || null;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    }

    const resolved = await PassiveIntelligenceService.resolveAlert(businessId, req.params.id);
    if (!resolved) {
      return res.status(404).json({ success: false, error: 'Alert tidak ditemukan atau sudah diselesaikan.' });
    }

    return res.json({ success: true, alert: resolved });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal menyelesaikan alert.' });
  }
});

export default router;
