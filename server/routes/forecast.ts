import { Router } from 'express';
import { ForecastRepository, ForecastSnapshot } from '../repositories/forecastRepository';
import { ForecastingService } from '../services/forecastingService';
import { ScenarioSimulator, SimulationInput } from '../services/scenarioSimulator';
import { NotificationRepository } from '../repositories/notificationRepository';

const router = Router();

// GET /api/forecast -> Get all snapshots
router.get('/', async (req, res) => {
  try {
    const list = await ForecastRepository.getAll(req.businessId);
    res.json({ success: true, snapshots: list });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal mengambil data prediksi' });
  }
});

// GET /api/forecast/latest -> Get the newest forecast snapshot
router.get('/latest', async (req, res) => {
  try {
    const activeBusinessId = req.businessId;
    let latest = await ForecastRepository.getLatest(activeBusinessId);
    // If no snapshots exist at all, generate an initial 7d forecast on demand so we don't have an empty state!
    if (!latest) {
      // intentionally silent in production; keep auto-bootstrap behavior
      latest = await ForecastingService.generateForecast('7d', activeBusinessId);
    }
    res.json({ success: true, snapshot: latest });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal mengambil data prediksi terbaru' });
  }
});

// GET /api/forecast/:id -> Get individual snapshot
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const activeBusinessId = req.businessId;
    const item = await ForecastRepository.getById(id, activeBusinessId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Snapshot tidak ditemukan' });
    }
    res.json({ success: true, snapshot: item });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal mengambil data snapshot' });
  }
});

// POST /api/forecast/generate -> Run the forecast algorithm and save the output as a snapshot
router.post('/generate', async (req, res) => {
  try {
    const { range = '7d' } = req.body;
    
    if (range !== '7d' && range !== '14d' && range !== '30d') {
      return res.status(400).json({ success: false, error: 'Rentang waktu (range) harus bernilai 7d, 14d, atau 30d' });
    }

    const snapshot = await ForecastingService.generateForecast(range, req.businessId);

    // Integrasi otomatisasi & notifikasi berdasarkan hasil kalkulasi snapshot:
    
    // 1. Jika level risiko bisnis kritis, trigger alert
    if (snapshot.risk_level === 'Critical' || snapshot.risk_level === 'High') {
      await NotificationRepository.create({
        business_id: snapshot.business_id || null,
        type: 'threat',
        title: 'Prediksi Tingkat Risiko Bisnis ' + (snapshot.risk_level === 'Critical' ? 'Kritis 🚨' : 'Tinggi ⚠'),
        message: `Kalkulasi model memproyeksikan indeks ancaman tinggi. Rekomendasi tindakan: ${snapshot.ai_recommendations.shortTerm[0] || 'Cek dashboard mitigasi.'}`,
        priority: snapshot.risk_level === 'Critical' ? 'critical' : 'high',
        metadata: { snapshot_id: snapshot.id, threat_radar: snapshot.risk_radar }
      });
    }

    // 2. Jika stockout risk < 3 hari, buat alarm logistik otomatis
    for (const item of snapshot.inventory_forecast) {
      if (item.daysToStockout <= 3) {
        await NotificationRepository.create({
          business_id: snapshot.business_id || null,
          type: 'inventory',
          title: `Pasokan Kritis: ${item.name} Habis < ${item.daysToStockout} Hari`,
          message: `Stok saat ini ${item.currentStock} pcs diproyeksikan habis dengan cepat. Tindakan supplier yang direkomendasikan: ${item.suggestedAction}`,
          priority: item.daysToStockout <= 1 ? 'critical' : 'high',
          metadata: { product_name: item.name, recommended_reorder: item.recommendedReorder }
        });
      }
    }

    // 3. Jika lead probability tinggi, buat sales follow-up reminder
    for (const lead of snapshot.crm_forecast) {
      if (lead.probability >= 60) {
        await NotificationRepository.create({
          business_id: snapshot.business_id || null,
          type: 'crm',
          title: `Peluang Closing Tinggi: ${lead.leadName} (Skor ${lead.probability}%)`,
          message: `Calon pelanggan prospektif bernilai tinggi diprediksi siap deal! Segera: ${lead.nextAction}`,
          priority: lead.probability >= 80 ? 'high' : 'medium',
          metadata: { lead_name: lead.leadName, estimated_value: lead.estimatedValue }
        });
      }
    }

    res.status(201).json({ success: true, message: 'Prediksi berhasil dibuat dan dikoordinasikan ke sistem notifikasi', snapshot });
  } catch (err: any) {
    console.error('API Error generating forecast context:', err);
    res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal memproses kalkulasi kecerdasan prediktif' });
  }
});

// POST /api/forecast/simulate -> Route parameters check & simulation calculator
router.post('/simulate', async (req, res) => {
  try {
    const { snapshot_id, expectedDailyGrowth, stockReorderDelayDays, leadConversionRate, promoBoost } = req.body;

    // Validate request body
    if (expectedDailyGrowth === undefined || stockReorderDelayDays === undefined || leadConversionRate === undefined || promoBoost === undefined) {
      return res.status(400).json({ success: false, error: 'Parameter simulasi expectedDailyGrowth, stockReorderDelayDays, leadConversionRate, dan promoBoost wajib dikirim' });
    }

    // Fetch snapshot
    let snapshot: ForecastSnapshot | null = null;
    const activeBusinessId = req.businessId;
    if (snapshot_id) {
      snapshot = await ForecastRepository.getById(snapshot_id, activeBusinessId);
    } else {
      snapshot = await ForecastRepository.getLatest(activeBusinessId);
    }

    if (!snapshot) {
      return res.status(404).json({ success: false, error: 'Snapshot acuan simulasi tidak ditemukan' });
    }
    const input: SimulationInput = {
      expectedDailyGrowth: Number(expectedDailyGrowth),
      stockReorderDelayDays: Number(stockReorderDelayDays),
      leadConversionRate: Number(leadConversionRate),
      promoBoost: Number(promoBoost)
    };

    // Cap values to reasonable percentages
    if (input.leadConversionRate < 0 || input.leadConversionRate > 100) return res.status(400).json({ success: false, error: 'Tingkat konversi harus berkisar antara 0 - 100%' });
    if (input.promoBoost < 0 || input.promoBoost > 200) return res.status(400).json({ success: false, error: 'Voucher boost dibatasi maksimal 200%' });

    const results = ScenarioSimulator.run(snapshot, input);

    res.json({
      success: true,
      results
    });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Simulasi kalkulasi masa depan gagal' });
  }
});

// DELETE /api/forecast/:id -> Delete snapshot
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const activeBusinessId = req.businessId;
    const snapshot = await ForecastRepository.getById(id, activeBusinessId);
    if (!snapshot) {
      return res.status(404).json({ success: false, error: 'Snapshot tidak ditemukan' });
    }
    const success = await ForecastRepository.delete(id, activeBusinessId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Snapshot tidak ditemukan' });
    }
    res.json({ success: true, message: 'Snapshot berhasil dihapus' });
  } catch (err: any) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Gagal menghapus snapshot' });
  }
});

export default router;

