import { AutomationRepository, AutomationRule } from '../repositories/automationRepository';
import { CRMLeadRepository, CRMLead } from '../repositories/crmLeadRepository';
import { NotificationRepository, NotificationRecord } from '../repositories/notificationRepository';
import { AnalysisHistoryRepository } from '../repositories/analysisHistoryRepository';

export class AutomationEngine {
  private static isRunning = false;

  /**
   * Run a sweep of all active rules across CRM data and Inventory alerts to produce
   * high fidelity system notifications.
   */
  static async runSweep(businessId?: string | null): Promise<{ triggeredCount: number }> {
    if (this.isRunning) return { triggeredCount: 0 };
    this.isRunning = true;

    const bid = businessId;
    if (!bid) {
      throw new Error('Workspace bisnis aktif wajib tersedia untuk menjalankan automasi.');
    }
    let triggeredCount = 0;

    try {
      // 1. Fetch active automation rules
      const rules = await AutomationRepository.getAll(bid);
      const activeRules = rules.filter(r => r.is_active);

      // 2. Fetch existing notifications to avoid flooding/duplicates
      const existingNotifs = await NotificationRepository.getAll(bid);

      // 3. Fetch resources
      const leads = await CRMLeadRepository.getAll(bid);
      const histories = await AnalysisHistoryRepository.getAll(bid);
      const latestAnalysis = histories.length > 0 ? histories[0] : null;

      for (const rule of activeRules) {
        
        // RULE TYPE A: Lead Overdue Reminder
        if (rule.rule_type === 'lead_overdue') {
          const thresholdDays = rule.trigger_config.threshold_value || 1;
          const nowTime = Date.now();

          for (const lead of leads) {
            if (lead.pipeline_stage === 'Won' || lead.pipeline_stage === 'Lost') continue;
            if (!lead.next_follow_up) continue;

            const followUpTime = new Date(lead.next_follow_up).getTime();
            if (followUpTime < nowTime) {
              const diffMs = nowTime - followUpTime;
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

              if (diffDays >= thresholdDays) {
                // Check if we already created a notification for this overdue lead
                const hasDuplicate = existingNotifs.some(n => 
                  n.type === 'crm_followup' && 
                  n.metadata && 
                  n.metadata.lead_id === lead.id &&
                  n.status === 'unread'
                );

                if (!hasDuplicate) {
                  await NotificationRepository.create({
                    business_id: bid,
                    type: 'crm_followup',
                    title: '🚨 Follow-up Terlambat: ' + lead.lead_name,
                    message: `Prospek dari ${lead.company_name || 'Personal'} (${lead.lead_name}) telah melewati jadwal follow-up selama ${diffDays} hari. Segera lakukan WhatsApp follow-up untuk mengamankan deal senilai Rp ${Number(lead.estimated_value || 0).toLocaleString('id-ID')}!`,
                    priority: lead.interest_level === 'Hot' ? 'high' : 'medium',
                    metadata: {
                      lead_id: lead.id,
                      lead_name: lead.lead_name,
                      company_name: lead.company_name,
                      phone: lead.phone,
                      estimated_value: lead.estimated_value,
                      interest_level: lead.interest_level,
                      overdue_days: diffDays
                    }
                  });
                  triggeredCount++;
                }
              }
            }
          }
        }

        // RULE TYPE B: Stock Critical Alert
        if (rule.rule_type === 'stock_critical' && latestAnalysis) {
          const thresholdStock = rule.trigger_config.threshold_value ?? 10;
          const products = latestAnalysis.top_products || [];

          for (const prod of products) {
            const stock = Number(prod.stock ?? prod.sales ?? 100); 
            // Check if stock is low
            if (stock <= thresholdStock) {
              const hasDuplicate = existingNotifs.some(n => 
                n.type === 'inventory_alert' &&
                n.metadata &&
                n.metadata.product_name === prod.name &&
                n.status === 'unread'
              );

              if (!hasDuplicate) {
                await NotificationRepository.create({
                  business_id: bid,
                  type: 'inventory_alert',
                  title: `⚠️ Stok Kritis: ${prod.name}`,
                  message: `Stok barang "${prod.name}" tersisa ${stock} unit (Batas aman: ${thresholdStock} unit). Segera hubungi supplier Anda sebelum kehabisan bahan produksi!`,
                  priority: stock === 0 ? 'critical' : 'high',
                  metadata: {
                    product_name: prod.name,
                    current_stock: stock,
                    threshold_limit: thresholdStock
                  }
                });
                triggeredCount++;
              }
            }
          }
        }

        // RULE TYPE C: High Lead Score Alert
        if (rule.rule_type === 'lead_score_high') {
          const thresholdScore = rule.trigger_config.threshold_value || 80;

          for (const lead of leads) {
            if (lead.pipeline_stage === 'Won' || lead.pipeline_stage === 'Lost') continue;
            const score = Number(lead.lead_score || 0);

            if (score >= thresholdScore) {
              const hasDuplicate = existingNotifs.some(n => 
                n.type === 'ai_recommendation' &&
                n.metadata &&
                n.metadata.lead_id === lead.id &&
                n.status === 'unread'
              );

              if (!hasDuplicate) {
                await NotificationRepository.create({
                  business_id: bid,
                  type: 'ai_recommendation',
                  title: `🔥 Prospek Potensial (Skor AI: ${score})`,
                  message: `Kecerdasan Buatan mendeteksi bahwa ${lead.lead_name} memiliki peluang closing ${score}%. Prioritaskan penawaran negosiasi khusus hari ini!`,
                  priority: 'high',
                  metadata: {
                    lead_id: lead.id,
                    lead_name: lead.lead_name,
                    lead_score: score,
                    estimated_value: lead.estimated_value
                  }
                });
                triggeredCount++;
              }
            }
          }
        }

      }

    } catch (err) {
      console.error('Automation Engine sweep error:', err);
    } finally {
      this.isRunning = false;
    }

    return { triggeredCount };
  }

  /**
   * Generates a daily executive summary report for the dashboard
   */
  static async generateDailySummary(businessId?: string | null): Promise<NotificationRecord | null> {
    const bid = businessId;
    if (!bid) {
      throw new Error('Workspace bisnis aktif wajib tersedia untuk membuat ringkasan harian.');
    }
    try {
      const leads = await CRMLeadRepository.getAll(bid);
      const activeLeads = leads.filter(l => l.pipeline_stage !== 'Won' && l.pipeline_stage !== 'Lost');
      const hotLeads = activeLeads.filter(l => l.interest_level === 'Hot').length;
      
      const histories = await AnalysisHistoryRepository.getAll(bid);
      const latestAnalysis = histories.length > 0 ? histories[0] : null;

      const totalActiveValue = activeLeads.reduce((su, l) => su + Number(l.estimated_value || 0), 0);
      const criticalStockCount = latestAnalysis 
        ? (latestAnalysis.top_products || []).filter((p: any) => Number(p.stock ?? 100) <= 10).length 
        : 0;

      const summaryMessage = `Ringkasan Bisnis Harian Anda:\n` +
        `- Prospek Aktif Pipeline: ${activeLeads.length} leads (Potensi omzet: Rp ${totalActiveValue.toLocaleString('id-ID')})\n` +
        `- Prospek Sangat Tertarik (Hot 🔥): ${hotLeads} prospek\n` +
        `- Kritis Inventoris/Gudang: ${criticalStockCount} item butuh restock cepat\n` +
        `Saran AI: Amankan negosiasi dengan hot leads hari ini demi meningkatkan closing-rate Anda minggu ini!`;

      // Check if summary was generated today
      const existing = await NotificationRepository.getAll(bid);
      const todaySummaryExists = existing.some(n => 
        n.type === 'daily_summary' && 
        n.created_at && 
        new Date(n.created_at).toDateString() === new Date().toDateString()
      );

      if (!todaySummaryExists) {
        const notif = await NotificationRepository.create({
          business_id: bid,
          type: 'daily_summary',
          title: '📈 Ringkasan Eksekutif Harian BizPilot',
          message: summaryMessage,
          priority: 'medium',
          metadata: {
            active_leads_count: activeLeads.length,
            leads_potential_value: totalActiveValue,
            hot_leads_count: hotLeads,
            critical_stocks_count: criticalStockCount
          }
        });
        return notif;
      }
    } catch (err) {
      console.error('Error generating daily summary alert:', err);
    }
    return null;
  }
}
