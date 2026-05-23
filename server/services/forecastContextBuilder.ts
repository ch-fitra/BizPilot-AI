import { BusinessProfileRepository, BusinessProfile } from '../repositories/businessProfileRepository';
import { AnalysisHistoryRepository, AnalysisHistoryRecord } from '../repositories/analysisHistoryRepository';
import { CRMLeadRepository, CRMLead } from '../repositories/crmLeadRepository';

export interface ForecastContextData {
  profile: BusinessProfile | null;
  latestAnalysis: AnalysisHistoryRecord | null;
  historyRecords: AnalysisHistoryRecord[];
  leads: CRMLead[];
  formattedContextPrompt: string;
}

export class ForecastContextBuilder {
  /**
   * Compiles multi-dimensional data models to feed deterministic algorithms and the Gemini analyzer.
   */
  static async buildContext(activeBusinessId?: string | null): Promise<ForecastContextData> {
    // 1. Business Profile
    let profile: BusinessProfile | null = null;
    try {
      profile = activeBusinessId
        ? await BusinessProfileRepository.getById(activeBusinessId)
        : await BusinessProfileRepository.getActiveProfile();
    } catch (err) {
      console.error('ForecastContextBuilder: Failed to load profile:', err);
    }

    // 2. Full Analysis History
    let historyRecords: AnalysisHistoryRecord[] = [];
    let latestAnalysis: AnalysisHistoryRecord | null = null;
    try {
      historyRecords = (await AnalysisHistoryRepository.getAll())
        .filter((record) => !activeBusinessId || record.business_id === activeBusinessId);
      if (historyRecords.length > 0) {
        latestAnalysis = historyRecords[0]; // sorted desc by date
      }
    } catch (err) {
      console.error('ForecastContextBuilder: Failed to load analysis histories:', err);
    }

    // 3. CRM Leads
    let leads: CRMLead[] = [];
    try {
      const activeBusinessId = profile?.id || null;
      leads = await CRMLeadRepository.getAll(activeBusinessId);
    } catch (err) {
      console.error('ForecastContextBuilder: Failed to load CRM leads:', err);
    }

    // 4. Build custom context prompt block for Gemini
    const parts: string[] = [];

    parts.push('=== PROFIL BISNIS ===');
    if (profile) {
      parts.push(`Nama Bisnis: ${profile.business_name}`);
      parts.push(`Kategori / Tipe: ${profile.business_type}`);
      parts.push(`Mata Uang: ${profile.currency || 'IDR'}`);
      parts.push(`Deskripsi: ${profile.description || 'Bisnis retail/F&B'});`);
    } else {
      parts.push('Profil belum dibuat.');
    }

    parts.push('\n=== RIWAYAT PENJUALAN PENDEK (HISTORIES) ===');
    if (historyRecords.length > 0) {
      const displayHistories = historyRecords.slice(0, 5);
      displayHistories.forEach((record, idx) => {
        const dateStr = new Date(record.created_at).toLocaleDateString('id-ID');
        parts.push(`Histori #${idx + 1} (${dateStr}):`);
        parts.push(`  - Skor Kesehatan: ${record.health_score}/100`);
        parts.push(`  - Total Omzet: ${record.total_sales}`);
        parts.push(`  - Total Transaksi: ${record.total_transactions}`);
        parts.push(`  - Level Risiko: ${record.risk_level}`);
        
        if (record.inventory_alerts && record.inventory_alerts.length > 0) {
          parts.push(`  - Alert Stok: ${record.inventory_alerts.join(', ')}`);
        }
        if (record.top_products && record.top_products.length > 0) {
          const names = record.top_products.slice(0, 3).map((p: any) => typeof p === 'string' ? p : (p.name || p.product_name || JSON.stringify(p)));
          parts.push(`  - Produk Populer: ${names.join(', ')}`);
        }
      });
    } else {
      parts.push('Tidak ada transaksi penjualan historis terdahulu.');
    }

    parts.push('\n=== DATA PIPELINE CRM LEADS ===');
    if (leads.length > 0) {
      const pendingLeads = leads.filter(l => l.pipeline_stage !== 'Lost' && l.pipeline_stage !== 'Won');
      parts.push(`Total Leads Operasional: ${leads.length} prospek`);
      parts.push(`Leads Aktif dalam Negosiasi: ${pendingLeads.length} prospek`);
      
      pendingLeads.slice(0, 8).forEach((lead, idx) => {
        parts.push(`Lead Prospek #${idx + 1}:`);
        parts.push(`  - Nama: ${lead.lead_name}`);
        parts.push(`  - Tahapan Pipeline: ${lead.pipeline_stage}`);
        parts.push(`  - Estimasi Nilai: ${lead.estimated_value}`);
        parts.push(`  - Skor Ketertarikan AI: ${lead.lead_score}/100`);
        parts.push(`  - Minat / Interest Level: ${lead.interest_level || 'Medium'}`);
        if (lead.next_follow_up) {
          parts.push(`  - Rencana Follow-up: ${new Date(lead.next_follow_up).toLocaleDateString('id-ID')}`);
        }
      });
    } else {
      parts.push('Belum ada leads / calon pelanggan dalam CRM pipeline.');
    }

    const formattedContextPrompt = parts.join('\n');

    return {
      profile,
      latestAnalysis,
      historyRecords,
      leads,
      formattedContextPrompt
    };
  }
}
