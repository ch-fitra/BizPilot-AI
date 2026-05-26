import { Router } from 'express';
import { enforceRole } from '../middleware/roleGuard';
import { BusinessMemoryService } from '../services/businessMemoryService';

const router = Router();

router.get('/business-memory', async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize || 10)));
    const memories = await BusinessMemoryService.listMemories(businessId, page, pageSize);
    return res.json({ success: true, memories, page, pageSize });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal mengambil business memory.' });
  }
});

router.post('/business-memory/generate', enforceRole('edit'), async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    const memoryType = req.body?.memory_type === 'monthly_summary' ? 'monthly_summary' : 'weekly_summary';
    const result = await BusinessMemoryService.generatePeriodMemory(businessId, memoryType);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal generate business memory.' });
  }
});

router.post('/business-memory/search', async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    const query = String(req.body?.query || '').trim();
    if (!query) return res.status(400).json({ success: false, error: 'Query wajib diisi.' });
    const limit = Math.min(5, Math.max(1, Number(req.body?.limit || 5)));
    const memories = await BusinessMemoryService.retrieveRelevantMemories(businessId, query, { limit });
    return res.json({ success: true, memories });
  } catch (err: any) {
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal mencari business memory.' });
  }
});

export default router;
