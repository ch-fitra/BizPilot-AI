import { Router } from 'express';
import { AnalysisHistoryRepository } from '../repositories/analysisHistoryRepository';
import { ForecastRepository } from '../repositories/forecastRepository';

const router = Router();

// GET all reports
router.get('/', async (req, res) => {
  try {
    const list = await AnalysisHistoryRepository.getAll();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports: ' + err.message
    });
  }
});

// GET single report by id
router.get('/:analysisId', async (req, res) => {
  try {
    const record = await AnalysisHistoryRepository.getById(req.params.analysisId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report detail: ' + err.message
    });
  }
});

// GET CSV representation of a report
router.get('/:analysisId/csv', async (req, res) => {
  try {
    const record = await AnalysisHistoryRepository.getById(req.params.analysisId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Report not found for CSV generation' });
    }

    const {
      analysis_id,
      business_name,
      business_type,
      created_at,
      health_score,
      risk_level,
      total_sales,
      total_transactions,
      top_products,
      inventory_alerts,
      customer_sentiment,
      customer_reviews_summary,
      action_plan,
      input_source
    } = record;

    let csvContent = '';

    // SECTION 1: MASTER SUMMARY
    csvContent += `"=== BIZPILOT AI BUSINESS PERFORMANCE EXECUTIVE REPORT ==="\n`;
    csvContent += `"Report ID","${analysis_id}"\n`;
    csvContent += `"Nama Usaha","${business_name.replace(/"/g, '""')}"\n`;
    csvContent += `"Tipe Usaha","${business_type.replace(/"/g, '""')}"\n`;
    csvContent += `"Tanggal Komputerisasi","${created_at}"\n`;
    csvContent += `"Skor Kesehatan Bisnis","${health_score} / 100"\n`;
    csvContent += `"Tingkat Risiko Operasional","${risk_level}"\n`;
    csvContent += `"Sumber Input Data","${input_source}"\n`;
    csvContent += `"Perkiraan Omzet / Total Sales","${total_sales}"\n`;
    csvContent += `"Volume Transaksi","${total_transactions}"\n`;
    
    const sentimentText = typeof customer_sentiment === 'string' 
      ? customer_sentiment 
      : (customer_sentiment?.sentiment || 'Neutral');
    csvContent += `"Sentimen Pelanggan","${sentimentText.replace(/"/g, '""')}"\n\n`;

    // SECTION 2: TOP SELLING PRODUCTS
    csvContent += `"=== TOP SELLING PRODUCTS ==="\n`;
    csvContent += `"Nama Produk","Kategori","Stok Hari Ini","Total Terjual","Pendapatan"\n`;
    if (top_products && top_products.length > 0) {
      top_products.forEach((prod: any) => {
        const pName = prod.name || prod.product_name || 'N/A';
        const pCat = prod.category || 'N/A';
        const pStock = prod.stock ?? prod.stock_level ?? 0;
        const pSold = prod.sold ?? prod.total_sold ?? 0;
        const pRev = prod.revenue ?? prod.earnings ?? 0;
        csvContent += `"${pName.replace(/"/g, '""')}","${pCat.replace(/"/g, '""')}","${pStock}","${pSold}","${pRev}"\n`;
      });
    } else {
      csvContent += `"N/A","N/A","N/A","N/A","N/A"\n`;
    }
    csvContent += `\n`;

    // SECTION 3: INVENTORY ALERTS
    csvContent += `"=== INVENTORY & SUPPLY CHAIN ALERTS ==="\n`;
    csvContent += `"Peringatan / Notifikasi Logistik"\n`;
    if (inventory_alerts && inventory_alerts.length > 0) {
      inventory_alerts.forEach((alert: string) => {
        csvContent += `"${alert.replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += `"Tidak ada peringatan keamanan stok."\n`;
    }
    csvContent += `\n`;

    // SECTION 4: REVIEWS SUMMARY
    csvContent += `"=== CUSTOMER CHAT & REVIEWS INSIGHTS ==="\n`;
    csvContent += `"Topik Masukan","Jumlah Sebutan (Mentions)","Tingkat Kepuasan","Ringkasan Masalah"\n`;
    if (customer_reviews_summary && customer_reviews_summary.length > 0) {
      customer_reviews_summary.forEach((rev: any) => {
        const topic = rev.topic || rev.aspect || 'N/A';
        const count = rev.count ?? rev.mentions ?? 0;
        const score = rev.satisfaction ?? rev.rating ?? 'N/A';
        const notes = rev.complaint || rev.summary || 'N/A';
        csvContent += `"${topic.replace(/"/g, '""')}","${count}","${score}","${notes.replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += `"N/A","N/A","N/A","N/A"\n`;
    }
    csvContent += `\n`;

    // SECTION 5: OPERATIONAL ACTION PLAN
    csvContent += `"=== MITIGASI OPERASIONAL & AI ACTION PLAN ==="\n`;
    csvContent += `"Prioritas","Rekomendasi Tugas (Task)","Divisi/Kategori","Status Eksekusi","Estimasi Dampak"\n`;
    if (action_plan && action_plan.length > 0) {
      action_plan.forEach((act: any) => {
        const prio = act.priority || 'Medium';
        const desc = act.task || act.description || 'N/A';
        const cat = act.category || 'Operasional';
        const status = act.status || 'Pending';
        const impact = act.impact || 'High Impact';
        csvContent += `"${prio}","${desc.replace(/"/g, '""')}","${cat.replace(/"/g, '""')}","${status}","${impact.replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += `"N/A","N/A","N/A","N/A","N/A"\n`;
    }

    // SECTION 6: FORECASTING & RISK AI PREDICTIONS
    csvContent += `\n`;
    csvContent += `"=== FORECASTING & RISK AI PREDICTIONS ==="\n`;
    try {
      const forecast = await ForecastRepository.getLatest();
      if (forecast) {
        csvContent += `"Rentang Prediksi","Proyeksi Omzet","Proyeksi Transaksi","Level Risiko Bisnis","Margin Keyakinan (Confidence)"\n`;
        csvContent += `"${forecast.forecast_range}","${forecast.projected_revenue}","${forecast.projected_transactions}","${forecast.risk_level}","${forecast.confidence_level}"\n\n`;
        
        csvContent += `"=== ESTIMASI MITIGASI AI & MATRIKS RISIKO ==="\n`;
        csvContent += `"Faktor Risiko Pembeli","${forecast.ai_recommendations.whyMatters.replace(/"/g, '""')}"\n`;
        csvContent += `"Ancaman Utama Terdeteksi","${forecast.ai_recommendations.causes.join(' [DAN] ').replace(/"/g, '""')}"\n`;
        csvContent += `"Saran Mitigasi Segera (24 Jam)","${forecast.ai_recommendations.shortTerm.join('; ').replace(/"/g, '""')}"\n`;
        csvContent += `"Saran Rencana Kerja Taktis (7 Hari)","${forecast.ai_recommendations.mediumTerm.join('; ').replace(/"/g, '""')}"\n`;
      } else {
        csvContent += `"Data peramalan prediktif belum dijalankan di sistem."\n`;
      }
    } catch (e: any) {
      csvContent += `"Gagal melampirkan proyeksi: ${e.message}"\n`;
    }

    // Prepare filename
    const safeBizName = business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const safeDate = new Date(created_at).toISOString().split('T')[0];
    const filename = `bizpilot-report-${safeBizName}-${safeDate}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);

  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate report CSV payload: ' + err.message
    });
  }
});

export default router;
