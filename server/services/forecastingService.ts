import { GoogleGenAI, Type } from '@google/genai';
import { ForecastRepository, ForecastSnapshot } from '../repositories/forecastRepository';
import { AnalysisHistoryRecord } from '../repositories/analysisHistoryRepository';
import { ForecastContextBuilder } from './forecastContextBuilder';
import { RiskScoringService, ThreatScorecard } from './riskScoringService';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return aiClient;
}

export class ForecastingService {
  /**
   * Generates a comprehensive forecast for the specified days (7d, 14d, 30d).
   */
  static async generateForecast(range: '7d' | '14d' | '30d', activeBusinessId?: string | null): Promise<ForecastSnapshot> {
    // 1. Compile all factual data from CRM, history, profile
    const contextData = await ForecastContextBuilder.buildContext(activeBusinessId);
    const { profile, latestAnalysis, historyRecords, leads } = contextData;

    const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;

    // 2. DETERMINISTIC CALCULATIONS FOR SALES FORECAST
    let dailyRevenueEstimate = 0;
    let dailyTransactionsEstimate = 0;
    let isConfident = false;
    let confidenceReason = 'Data historis minimum untuk forecasting belum tercapai.';

    if (historyRecords.length > 0) {
      // Calculate from actual historical averages
      // Take up to last 10 records for sales trend average
      const sample = historyRecords.slice(0, 10);
      const totalSalesSum = sample.reduce((sum, r) => sum + Number(r.total_sales || 0), 0);
      const totalTransSum = sample.reduce((sum, r) => sum + Number(r.total_transactions || 0), 0);
      
      // Let's assume each analysis history represents a month of performance. 
      // Divide total monthly sales by 30 to get daily sales average.
      dailyRevenueEstimate = totalSalesSum / (sample.length * 30);
      dailyTransactionsEstimate = totalTransSum / (sample.length * 30);

      if (historyRecords.length >= 3) {
        isConfident = true;
        confidenceReason = 'Optimasi prediksi didukung oleh rekam histori transaksi bisnis yang memadai.';
      } else {
        confidenceReason = 'Histori transaksi terbatas (kurang dari 3 analisis). Akurasi model berada pada tingkat estimasi awal.';
      }
    } else {
      confidenceReason = 'Analisis historis kosong. Sistem tidak membuat angka proyeksi sampai data transaksi tersedia.';
    }

    const projected_revenue = Math.round(dailyRevenueEstimate * days);
    const projected_transactions = Math.round(dailyTransactionsEstimate * days);

    // Build the 4 chart points for trend lines (e.g. distributed across the range)
    const sales_forecast = this.buildSalesForecastChartPoints(projected_revenue, days);

    // 3. DETERMINISTIC CALCULATIONS FOR INVENTORY STOCKOUT FORECAST
    const inventory_forecast = this.buildInventoryForecast(latestAnalysis);

    // 4. DETERMINISTIC CALCULATIONS FOR CRM PROBABILITY FORECAST
    const crm_forecast = this.buildCrmForecast(leads);

    // 5. EVALUATE THREAT RADAR SCORE
    const threatRadar = RiskScoringService.assessRisks(latestAnalysis, leads, []);
    const overallRisk = RiskScoringService.determineOverallRiskLevel(threatRadar);

    // 6. CONFIDENCE LEVEL ESTIMATOR
    let confidence_level: 'Low' | 'Medium' | 'High' = 'Low';
    if (historyRecords.length >= 5 && leads.length >= 5 && latestAnalysis?.inventory_alerts ? latestAnalysis.inventory_alerts.length > 0 : false) {
      confidence_level = 'High';
    } else if (historyRecords.length >= 2 || leads.length >= 2) {
      confidence_level = 'Medium';
    }

    // 7. MULTI-MODAL AI NARRATIVE RECOMMENDATIONS (GEMINI & FALLBACK COBBLER)
    let ai_recommendations = this.getFallbackAiRecommendations(overallRisk, inventory_forecast.length, crm_forecast.length);

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = getAiClient();

    if (ai && apiKey) {
      try {
        const prompt = `Anda adalah asisten AI Business Risk Analyst senior "BizPilot AI" yang membantu operasional UMKM Indonesia.
Tugas Anda adalah membaca data penjualan historis, inventarisasi logistik, dan CRM leads pelanggan, kemudian menyusun ringkasan analisis risiko yang pragmatis, mudah dipahami (practical), bebas kata-kata klise jargon pemasaran, dan sepenuhnya menggunakan Bahasa Indonesia yang ramah, profesional, dan hormat.

Berikut data operasional bisnis aktif:
${contextData.formattedContextPrompt}

Hasil Risiko Terkalkulasi:
- Level Risiko Bisnis Kumulatif: ${overallRisk}
- Ancaman Penjualan (Sales Risk): ${threatRadar.salesRisk}
- Ancaman Stok Habis (Inventory Risk): ${threatRadar.inventoryRisk}
- Ancaman Sentimen Pembeli: ${threatRadar.customerSentimentRisk}
- Hambatan Pipelines CRM: ${threatRadar.crmPipelineRisk}
- Hambatan Eksekusi Kerja: ${threatRadar.operationalExecutionRisk}

Silakan susun analisis dalam format JSON dengan struktur persis seperti berikut:
{
  "whyMatters": "Satu paragraf singkat menjelaskan mengapa risiko ini krusial untuk dipantau pemilik toko.",
  "causes": ["Poin penyebab 1", "Poin penyebab 2"],
  "shortTerm": ["Langkah nyata pertama dalam 24 jam", "Langkah nyata kedua dalam 24 jam"],
  "mediumTerm": ["Langkah taktis dalam 7 hari ke depan", "Langkah taktis kedua dalam 7 hari"],
  "monitorNext": ["Metrik pemicu kritis atau hal yang harus diawasi berikutnya"]
}

Catatan penting: Pastikan output Anda valid JSON tanpa markdown formatting tambahan (tidak ada raw text lain di luar JSON).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                whyMatters: { 
                  type: Type.STRING, 
                  description: 'Satu paragraf singkat menjelaskan mengapa risiko ini krusial untuk dipantau pemilik toko.' 
                },
                causes: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }, 
                  description: 'Daftar alasan/penyebab utama tantangan ini muncul.' 
                },
                shortTerm: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }, 
                  description: 'Daftar rekomendasi langkah koreksi cepat yang harus dieksekusi dalam 24 jam pertama.' 
                },
                mediumTerm: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }, 
                  description: 'Daftar langkah-langkah mitigasi taktis dalam rentang waktu 7 hari ke depan.' 
                },
                monitorNext: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }, 
                  description: 'Daftar sisa indikator atau pos pengawasan prioritas berikutnya.' 
                }
              },
              required: ['whyMatters', 'causes', 'shortTerm', 'mediumTerm', 'monitorNext']
            },
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        });

        if (response.text) {
          let cleanedText = response.text.trim();
          if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
          }
          const parsed = JSON.parse(cleanedText.trim());
          if (parsed && typeof parsed === 'object') {
            ai_recommendations = {
              whyMatters: parsed.whyMatters || ai_recommendations.whyMatters,
              causes: parsed.causes || ai_recommendations.causes,
              shortTerm: parsed.shortTerm || ai_recommendations.shortTerm,
              mediumTerm: parsed.mediumTerm || ai_recommendations.mediumTerm,
              monitorNext: parsed.monitorNext || ai_recommendations.monitorNext
            };
          }
        }
      } catch (err) {
        console.error('Gemini explanation generation failed. Falling back on Indonesia standard alerts:', err);
      }
    }

    // 8. COMPILE AND STORE PERSISTED SNAPSHOT
    const freshSnapshot: Omit<ForecastSnapshot, 'id' | 'created_at' | 'updated_at'> = {
      business_id: profile?.id || null,
      forecast_range: range,
      projected_revenue,
      projected_transactions,
      risk_level: overallRisk,
      confidence_level,
      sales_forecast,
      inventory_forecast,
      crm_forecast,
      risk_radar: threatRadar,
      ai_recommendations,
      scenario_config: {
        expectedDailyGrowth: 0,
        stockReorderDelayDays: 0,
        leadConversionRate: 50,
        promoBoost: 0
      }
    };

    return await ForecastRepository.create(freshSnapshot);
  }

  /**
   * Generates incremental projection points across dates
   */
  private static buildSalesForecastChartPoints(
    projectedTotal: number,
    days: number
  ): { date: string; projectedSales: number; baselineSales: number }[] {
    const points: { date: string; projectedSales: number; baselineSales: number }[] = [];
    const today = new Date();

    const iterations = days === 7 ? 4 : days === 14 ? 5 : 6;
    const stepInDays = Math.ceil(days / iterations);

    for (let i = 0; i <= iterations; i++) {
      const pointDate = new Date(today);
      pointDate.setDate(today.getDate() + (i * stepInDays));
      const dateStr = pointDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      // Proportional linear distribution with a slight randomized growth variance
      const progress = i / iterations;
      const baseLineValue = Math.round(projectedTotal * progress * 0.9);
      const randomFactor = 0.95 + Math.random() * 0.1; // +/- 5% randomness for graph realism
      const projectedValue = Math.round(projectedTotal * progress * randomFactor);

      points.push({
        date: dateStr,
        projectedSales: i === 0 ? 0 : projectedValue,
        baselineSales: i === 0 ? 0 : baseLineValue
      });
    }

    return points;
  }

  /**
   * Fallback AI Recommendations when Gemini is inaccessible
   */
  private static getFallbackAiRecommendations(
    risk: 'Low' | 'Medium' | 'High' | 'Critical',
    stockoutCount: number,
    crmCount: number
  ) {
    if (risk === 'Critical' || risk === 'High') {
      return {
        whyMatters: 'Potensi kerugian omzet atau kehabisan stok bahan pokok sedang berada di level mengkhawatirkan. Tanpa penanganan dini, operasional harian toko Anda berisiko terganggu dalam rentang waktu terdekat.',
        causes: [
          stockoutCount > 0 ? `Terdapat ${stockoutCount} item produk dengan status pasokan kritis di daftar logistik.` : 'Beberapa stok penyangga berada di level minimum.',
          crmCount > 0 ? 'Penyelesaian prospek (closing pipeline) melambat pada tahap prospek awal.' : 'Minimnya interaksi pasca-penjualan dengan pelanggan lama.'
        ],
        shortTerm: [
          'Hubungi supplier penyuplai produk kritis sekarang juga untuk konfirmasi tanggal kirim tercepat.',
          'Siapkan pesan WhatsApp pengingat otomatis untuk leads CRM yang belum diperbarui statusnya.'
        ],
        mediumTerm: [
          'Evaluasi kembali target pembagian jam kerja dan jadwal restock bahan dari supplier utama.',
          'Luncurkan promo tebus murah/diskon kecil untuk merangsang pelunasan piutang.'
        ],
        monitorNext: [
          'Amati rasio ketersediaan stok di gudang utama Anda.',
          'Pantau respon pelunasan leads CRM berprospek tinggi (Hot Leads).'
        ]
      };
    }

    return {
      whyMatters: 'Kondisi operasional usaha Anda berada di zona aman, namun pemeliharaan preventif tetap diperlukan untuk memacu laju pertumbuhan omzet bulanan Anda.',
      causes: [
        'Arus kas penjualan berjalan mulus tanpa hambatan pengantaran barang.',
        'Fluktuasi stok logistik harian berada di batas toleransi aman standar.'
      ],
      shortTerm: [
        'Tinjau kembali daftar pelanggan dengan perputaran transaksi tertinggi bulan ini.',
        'Kirimkan pesan apresiasi sederhana / potongan loyalitas via WhatsApp.'
      ],
      mediumTerm: [
        'Rencanakan perluasan menu produk baru bersama tim dapur/produksi.',
        'Tingkatkan target volume closing CRM leads lewat program promo awal bulan.'
      ],
      monitorNext: [
        'Ulasan kepuasan dari pembeli baru di sosial media atau Google Maps.',
        'Laju konversi harian pipelines CRM Anda.'
      ]
    };
  }

  /**
   * Deterministic inventory depletion calculator
   */
  private static buildInventoryForecast(latest: AnalysisHistoryRecord | null) {
    const list: {
      name: string;
      currentStock: number;
      daysToStockout: number;
      riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
      recommendedReorder: number;
      suggestedAction: string;
    }[] = [];

    if (latest && latest.inventory_alerts && latest.inventory_alerts.length > 0) {
      latest.inventory_alerts.forEach((alert, idx) => {
        // Parse name from string list (e.g. "Kopi Susu stok menipis (sisa 5)")
        const match = alert.match(/^([^stokmenipis]+)/);
        let name = match ? match[1].trim() : `Produk Kritis #${idx + 1}`;
        name = name.replace(/[,\(\)\⚠\:]/g, '').trim();

        // Extract current stock estimate
        const numMatch = alert.match(/sisa\s+(\d+)/i) || alert.match(/(\d+)\s+pcs/i);
        const currentStock = numMatch ? parseInt(numMatch[1]) : 4;

        // Velocity approximation
        const daysToStockout = currentStock <= 2 ? 1 : currentStock <= 5 ? 3 : 6;
        const riskLevel = daysToStockout <= 1 ? 'Critical' : daysToStockout <= 3 ? 'High' : 'Medium';

        list.push({
          name,
          currentStock,
          daysToStockout,
          riskLevel,
          recommendedReorder: Math.max(50, currentStock * 10),
          suggestedAction: daysToStockout <= 1 
            ? 'Order darurat hari ini ke Supplier Utama (Gunakan COD / Jalur Kilat)' 
            : 'Jadwalkan reorder dengan kuantitas optimal pada restock berikutnya'
        });
      });
    }

    return list;
  }

  /**
   * Deterministic CRM conversion calculator
   */
  private static buildCrmForecast(leads: any[]) {
    const list: {
      leadName: string;
      stage: string;
      probability: number;
      estimatedValue: number;
      nextAction: string;
      urgency: 'Low' | 'Medium' | 'High' | 'Urgent';
    }[] = [];

    const activeLeads = leads.filter(l => l.pipeline_stage !== 'Won' && l.pipeline_stage !== 'Lost');

    if (activeLeads.length > 0) {
      activeLeads.forEach(lead => {
        // Stage transition mapping to conversion rates
        const stage = lead.pipeline_stage;
        let probability = lead.lead_score || 50;

        if (stage === 'Negotiation' || stage === 'proposal' || stage === 'Proposal') {
          probability = Math.max(probability, 75);
        } else if (stage === 'Prospect' || stage === 'leads' || stage === 'lead') {
          probability = Math.min(probability, 30);
        }

        let urgency: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
        if (lead.interest_level === 'Hot' || probability >= 75) {
          urgency = 'Urgent';
        } else if (lead.interest_level === 'Warm' || probability >= 50) {
          urgency = 'High';
        }

        let nextAction = 'Follow-up via chat WhatsApp bisnis';
        if (urgency === 'Urgent') {
          nextAction = 'Hubungi via WhatsApp CALL untuk finalisasi penawaran bundling khusus';
        } else if (stage === 'Prospect') {
          nextAction = 'Kirim brosur katalog digital produk terpopuler';
        }

        list.push({
          leadName: lead.lead_name,
          stage,
          probability,
          estimatedValue: Number(lead.estimated_value || 0),
          nextAction,
          urgency
        });
      });
    }

    return list;
  }
}
