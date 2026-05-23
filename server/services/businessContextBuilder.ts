import { BusinessProfileRepository, BusinessProfile } from '../repositories/businessProfileRepository';
import { AnalysisHistoryRepository, AnalysisHistoryRecord } from '../repositories/analysisHistoryRepository';
import { ChatHistoryRepository, ChatMessageRecord } from '../repositories/chatHistoryRepository';
import { CRMLeadRepository, CRMLead } from '../repositories/crmLeadRepository';
import { NotificationRepository } from '../repositories/notificationRepository';
import { ForecastRepository } from '../repositories/forecastRepository';

export interface BusinessContext {
  profile: BusinessProfile | null;
  analysis: AnalysisHistoryRecord | null;
  historySummary: string;
  compiledContextText: string;
  sourceIndicator: {
    hasProfile: boolean;
    hasAnalysis: boolean;
    analysisDate: string | null;
    analysisId: string | null;
  };
}

export class BusinessContextBuilder {
  /**
   * Main builder method that retrieves relevant active records and structures a concise, dense prompt context.
   */
  static async buildContext(
    businessId?: string | null,
    analysisId?: string | null,
    includeHistory: boolean = true
  ): Promise<BusinessContext> {
    // 1. Gather Business Profile
    let profile: BusinessProfile | null = null;
    try {
      profile = await BusinessProfileRepository.getActiveProfile();
    } catch (err) {
      console.error('ContextBuilder: Error loading active profile:', err);
    }

    // 2. Gather Analysis Record
    let analysis: AnalysisHistoryRecord | null = null;
    try {
      if (analysisId) {
        analysis = await AnalysisHistoryRepository.getById(analysisId);
      } else {
        analysis = await AnalysisHistoryRepository.getLatest();
      }
    } catch (err) {
      console.error('ContextBuilder: Error loading analysis history:', err);
    }

    // 3. Gather previous chat messages for history context if requested
    let historyStr = 'Tidak ada percakapan sebelumnya.\n';
    if (includeHistory) {
      try {
        const messages = await ChatHistoryRepository.getAll(businessId || (profile?.id));
        // Only grab the last 8-10 messages to keep the context size optimized
        const recentMessages = messages.slice(-10);
        if (recentMessages.length > 0) {
          historyStr = recentMessages
            .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n');
        }
      } catch (err) {
        console.error('ContextBuilder: Error compiling chat history context:', err);
      }
    }

    // 4. Build text description block and serialize
    const parts: string[] = [];

    // --- Profile Context ---
    parts.push('=== PROFIL BISNIS AKTIF ===');
    if (profile) {
      parts.push(`- Nama Bisnis: ${profile.business_name}`);
      parts.push(`- Kategori / Tipe: ${profile.business_type || 'Belum diatur'}`);
      parts.push(`- Pemilik / Owner: ${profile.owner_name || 'Belum diatur'}`);
      parts.push(`- Lokasi: ${profile.location || 'Belum diatur'}`);
      parts.push(`- Deskripsi Bisnis: ${profile.description || 'Kedai kopi/toko kelontong operasional'}`);
    } else {
      parts.push('Informasi profil bisnis belum tersedia.');
    }

    // --- Analysis Context ---
    parts.push('\n=== DATA KESEHATAN DAN KINERJA BISNIS TERBARU ===');
    if (analysis) {
      const dateTag = new Date(analysis.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      parts.push(`- Tanggal Analisis Selesai: ${dateTag}`);
      parts.push(`- Skor Kesehatan Bisnis (Health Score): ${analysis.health_score}/100`);
      parts.push(`- Level Risiko (Risk Level): ${analysis.risk_level || 'Normal'}`);
      parts.push(`- Total Omzet Penjualan (Sales): ${profile?.currency || 'IDR'} ${Number(analysis.total_sales).toLocaleString('id-ID')}`);
      parts.push(`- Total Transaksi: ${analysis.total_transactions} kali`);

      // Products Summary
      parts.push('\n--- PRODUK TERPOPULER ATAU PRIORITAS ---');
      if (Array.isArray(analysis.top_products) && analysis.top_products.length > 0) {
        analysis.top_products.slice(0, 5).forEach((item: any, idx: number) => {
          if (typeof item === 'string') {
            parts.push(`${idx + 1}. ${item}`);
          } else {
            const name = item.name || item.product_name || 'Produk';
            const salesQty = item.quantity || item.sales || item.sales_count || '';
            const contribution = item.revenue || item.contribution || '';
            parts.push(`${idx + 1}. ${name} (${salesQty ? `Terjual: ${salesQty}` : ''}${contribution ? `, Omzet: ${contribution}` : ''})`);
          }
        });
      } else {
        parts.push('(Data produk terpopuler kosong)');
      }

      // Inventory alerts summary
      parts.push('\n--- PERINGATAN LOGISTIK ATAU INVENTORY ---');
      if (Array.isArray(analysis.inventory_alerts) && analysis.inventory_alerts.length > 0) {
        analysis.inventory_alerts.forEach((alert: any, idx: number) => {
          const alertMsg = typeof alert === 'string' ? alert : (alert.message || alert.alert || JSON.stringify(alert));
          parts.push(`⚠ [WARNING] ${alertMsg}`);
        });
      } else {
        parts.push('✓ Stok dan gudang dalam kondisi aman. Tidak ada alert inventory.');
      }

      // Customer sentiment summary
      parts.push('\n--- SENTIMEN / ULASAN PELANGGAN ---');
      if (analysis.customer_sentiment) {
        const sentimentVal = analysis.customer_sentiment;
        if (typeof sentimentVal === 'string') {
          parts.push(sentimentVal);
        } else {
          const overall = sentimentVal.overall || sentimentVal.score || 'Netral';
          const posRatio = sentimentVal.positive_ratio || sentimentVal.positivity || '';
          const keywords = Array.isArray(sentimentVal.keywords) ? sentimentVal.keywords.join(', ') : (sentimentVal.top_topics || '');
          parts.push(`- Skor Sentimen: ${overall} (${posRatio ? `Rasio Positif: ${posRatio}` : ''})`);
          if (keywords) parts.push(`- Kata Kunci Review: ${keywords}`);
        }
      } else {
        parts.push('Belum ada feedback sentimen pelanggan yang dianalisis.');
      }

      // Action plan summary
      parts.push('\n--- ACTION PLAN (REKOMENDASI OPERASIONAL) ---');
      if (Array.isArray(analysis.action_plan) && analysis.action_plan.length > 0) {
        analysis.action_plan.slice(0, 8).forEach((item: any, idx: number) => {
          if (typeof item === 'string') {
            parts.push(`- [ ] ${item}`);
          } else {
            const act = item.action || item.recommendation || item.task || 'Tugas';
            const prio = item.priority || item.prio || 'Normal';
            const horizon = item.time_frame || item.timeline || item.horizon || 'Segera';
            const dept = item.department || item.category || 'Operasional';
            parts.push(`- [ ] [Prioritas: ${prio}] [Waktu: ${horizon}] [Bidang: ${dept}] -> ${act}`);
          }
        });
      } else {
        parts.push('Belum ada rencana tindakan kerja yang terbuat.');
      }

    } else {
      parts.push('⚠️ Belum ada riwayat tumpukan analisis performa bisnis yang terekam atau diunggah.');
    }

    // --- CRM / Sales Leads Context ---
    parts.push('\n=== DATA PIPELINE DAN LEADS CRM (POTENSI CLOSING) ===');
    try {
      const leads = await CRMLeadRepository.getAll(businessId || (profile?.id));
      if (leads.length > 0) {
        const activeLeads = leads.filter(l => l.pipeline_stage !== 'Lost' && l.pipeline_stage !== 'Won');
        const wonLeads = leads.filter(l => l.pipeline_stage === 'Won');
        const hotLeads = activeLeads.filter(l => l.interest_level === 'Hot' || l.lead_score >= 70);
        
        const totalEstValue = activeLeads.reduce((sum, l) => sum + Number(l.estimated_value || 0), 0);
        
        parts.push(`- Total Leads Tercatat: ${leads.length} prospek`);
        parts.push(`- Leads Aktif (Pending Follow-up): ${activeLeads.length} prospek`);
        parts.push(`- Total Nilai Est. Revenue Aktif: ${profile?.currency || 'IDR'} ${totalEstValue.toLocaleString('id-ID')}`);
        parts.push(`- Jumlah Deals Berhasil (Won): ${wonLeads.length} deal`);
        
        if (hotLeads.length > 0) {
          parts.push('\n--- PROSPEK PRIORITAS / HOT LEADS ---');
          hotLeads.slice(0, 5).forEach((l, idx) => {
            const followUpTag = l.next_follow_up 
              ? `(Follow-up berikutnya: ${new Date(l.next_follow_up).toLocaleDateString('id-ID')})` 
              : '(Belum diatur jadwal follow-up)';
            parts.push(`${idx + 1}. [ID: ${l.id}] ${l.lead_name} - ${l.company_name || 'Personal'}`);
            parts.push(`   * Tahap: ${l.pipeline_stage} | Skor AI: ${l.lead_score}/100 | Est. Nilai: ${profile?.currency || 'IDR'} ${Number(l.estimated_value).toLocaleString('id-ID')}`);
            parts.push(`   * Kontak: ${l.phone || 'No Phone'} / ${l.email || 'No Email'}`);
            parts.push(`   * Info Kebutuhan/Catatan: ${l.notes || 'Tidak ada catatan'}`);
            parts.push(`   * Jadwal: ${followUpTag}`);
          });
        } else {
          parts.push('- Tidak ada Hot Leads prioritasi tinggi saat ini.');
        }

        // List any overdue followups for context awareness
        const overdueLeads = activeLeads.filter(l => l.next_follow_up && new Date(l.next_follow_up).getTime() < Date.now());
        if (overdueLeads.length > 0) {
          parts.push('\n--- PERINGATAN KETERLAMBATAN FOLLOW-UP (OVERDUE) ---');
          overdueLeads.slice(0, 3).forEach(ol => {
            parts.push(`⚠ Overdue: ${ol.lead_name} (Tahap: ${ol.pipeline_stage}, Jadwal: ${ol.next_follow_up ? new Date(ol.next_follow_up).toLocaleDateString('id-ID') : '?'})`);
          });
        }
      } else {
        parts.push('Belum ada data calon pelanggan / leads dalam sistem CRM.');
      }
    } catch (err) {
      console.error('ContextBuilder: Error fetching CRM Leads for AI Prompt context:', err);
    }

    // --- Phase 7 Notifications & Automation Alerts Context ---
    parts.push('\n=== PERINGATAN DAN NOTIFIKASI AKTIF HARI INI ===');
    try {
      const notificationsList = await NotificationRepository.getAll(businessId || (profile?.id));
      const unreadNotifs = notificationsList.filter(n => n.status === 'unread');
      
      if (unreadNotifs.length > 0) {
        parts.push(`- Kumpulan (${unreadNotifs.length}) Peringatan Belum Ditindaklanjuti:`);
        unreadNotifs.slice(0, 5).forEach((n, idx) => {
          parts.push(`  ${idx + 1}. [Tipe: ${n.type}, Prioritas: ${n.priority}] ${n.title}`);
          parts.push(`     * Detail: ${n.message}`);
        });
      } else {
        parts.push('- Tidak ada peringatan baru yang belum dibaca hari ini. Semua operasional aman!');
      }
    } catch (err) {
      console.error('ContextBuilder: Error fetching notifications for context:', err);
    }

    // --- Phase 8 Forecasting & Risk AI Context ---
    parts.push('\n=== PROYEKSI INTELEGENSI FORECASTING & RISIKO BISNIS (7-30 HARI KE DEPAN) ===');
    try {
      const forecast = await ForecastRepository.getLatest();
      if (forecast) {
        parts.push(`- Rentang Analisis Prediksi: ${forecast.forecast_range}`);
        parts.push(`- Proyeksi Total Omzet Rentang Ini: ${profile?.currency || 'IDR'} ${forecast.projected_revenue.toLocaleString('id-ID')}`);
        parts.push(`- Proyeksi Volume Transaksi: ${forecast.projected_transactions} transaksi`);
        parts.push(`- Indeks Risiko Bisnis Saat Ini: ${forecast.risk_level}`);
        parts.push(`- Tingkat Keyakinan Prediksi (Confidence): ${forecast.confidence_level}`);
        
        parts.push('\n--- PROYEKSI PRODUK BERISIKO HABIS (STOCKOUT PREVENTIONS) ---');
        const criticalStocks = forecast.inventory_forecast.filter(i => i.daysToStockout <= 5);
        if (criticalStocks.length > 0) {
          criticalStocks.forEach(cs => {
            parts.push(`  * ${cs.name}: Stok saat ini ${cs.currentStock} pcs, diprediksi habis dalam ${cs.daysToStockout} hari (${cs.riskLevel} Risk). Rekomendasi order: ${cs.recommendedReorder} pcs.`);
          });
        } else {
          parts.push('  * Seluruh pasokan logistik diproyeksikan aman untuk 7 hari ke depan.');
        }

        parts.push('\n--- PROYEKSI CLOSING PIPELINE CRM ---');
        const hotProspects = forecast.crm_forecast.filter(c => c.probability >= 50);
        if (hotProspects.length > 0) {
          hotProspects.forEach(hp => {
            parts.push(`  * ${hp.leadName} (${hp.stage}): Kemungkinan Closing ${hp.probability}%, Estimasi Nilai: ${profile?.currency || 'IDR'} ${hp.estimatedValue.toLocaleString('id-ID')} | Aksi Terdekat: ${hp.nextAction}`);
          });
        } else {
          parts.push('  * Belum ada prospek hangat yang berpotensi closing dekat.');
        }

        parts.push('\n--- REKOMENDASI AI UNTUK PENURUNAN RISIKO ---');
        parts.push(`  * Mengapa Risiko Ini Penting: ${forecast.ai_recommendations.whyMatters}`);
        parts.push(`  * Poin Penyebab Utama: ${forecast.ai_recommendations.causes.join(', ')}`);
        parts.push(`  * Tindakan Mitigasi 24 Jam: ${forecast.ai_recommendations.shortTerm.join(', ')}`);
        parts.push(`  * Tindakan Mitigasi 7 Hari: ${forecast.ai_recommendations.mediumTerm.join(', ')}`);
      } else {
        parts.push('Belum ada snapshot forecasting terbaru yang dihitung.');
      }
    } catch (err) {
      console.error('ContextBuilder: Error fetching forecasting context:', err);
    }

    const compiledContextText = parts.join('\n');

    return {
      profile,
      analysis,
      historySummary: historyStr,
      compiledContextText,
      sourceIndicator: {
        hasProfile: !!profile,
        hasAnalysis: !!analysis,
        analysisDate: analysis ? analysis.created_at : null,
        analysisId: analysis ? analysis.analysis_id : null
      }
    };
  }
}
