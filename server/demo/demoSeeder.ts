import fs from 'fs/promises';
import path from 'path';
import { demoScenarios } from './demoScenarios';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing } from '../db/supabaseClient';

const PROFILE_FILE_PATH = path.join(process.cwd(), 'business_profile.json');
const LEADS_FILE_PATH = path.join(process.cwd(), 'crm_leads.json');
const HISTORY_FILE_PATH = path.join(process.cwd(), 'history.json');
const FORECAST_FILE_PATH = path.join(process.cwd(), 'forecast_snapshots.json');
const NOTIFICATIONS_FILE_PATH = path.join(process.cwd(), 'notifications.json');

export class DemoSeeder {
  /**
   * Safe JSON file re-writer helper
   */
  private static async writeJsonFile(filePath: string, data: any): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`DemoSeeder error writing to ${filePath}:`, err);
    }
  }

  /**
   * Safe JSON file readers to fetch existing records
   */
  private static async readJsonFile<T>(filePath: string, defaultVal: T): Promise<T> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return defaultVal;
    }
  }

  /**
   * Seed a specific scenario by ID
   */
  static async seedScenario(scenarioId: string, activeBusinessId: string = 'local_profile_id'): Promise<boolean> {
    const scenario = demoScenarios[scenarioId];
    if (!scenario) {
      console.error(`[DEMO SEEDER] Skenario "${scenarioId}" tidak terdaftar`);
      return false;
    }

    console.log(`[DEMO SEEDER] Memulai penyemaian skenario khusus: ${scenario.title}`);

    // Adjust demographic indicators to tie back to active business context
    const businessData = {
      ...scenario.business,
      id: activeBusinessId,
      updated_at: new Date().toISOString()
    };

    // 1. Seed Business Profile
    const profiles = await this.readJsonFile<any[]>(PROFILE_FILE_PATH, []);
    const filteredProfiles = profiles.filter((p) => p.id !== activeBusinessId);
    filteredProfiles.unshift(businessData);
    await this.writeJsonFile(PROFILE_FILE_PATH, filteredProfiles);

    // 2. Seed CRM Leads
    const currentLeads = await this.readJsonFile<any[]>(LEADS_FILE_PATH, []);
    const preservedLeads = currentLeads.filter((lead) => lead.business_id !== activeBusinessId);
    const configuredLeads = scenario.leads.map((lead) => ({
      ...lead,
      business_id: activeBusinessId,
      created_at: new Date().toISOString()
    }));
    await this.writeJsonFile(LEADS_FILE_PATH, [...configuredLeads, ...preservedLeads]);

    // 3. Seed AI Analysis History
    const currentHist = await this.readJsonFile<any[]>(HISTORY_FILE_PATH, []);
    const preservedHist = currentHist.filter((history) => history.business_id !== activeBusinessId);

    const seededHistoryRecords = scenario.history.map((hist) => {
      // Build proper AnalysisHistoryRecord
      return {
        analysis_id: hist.id,
        business_id: activeBusinessId,
        business_name: businessData.business_name,
        business_type: businessData.business_type,
        input_source: 'demo' as const,
        raw_input_summary: `Skenario Demo Juri untuk bisnis: ${businessData.business_name} (${businessData.business_type})`,
        ai_result: {
          health_score: hist.health_score,
          health_summary: hist.health_summary,
          strengths: hist.strengths,
          risks: hist.risks,
          sales_trend: hist.sales_trend,
          alerts: hist.alerts,
          sales_data: hist.sales_data,
          top_products: hist.top_products,
          customer_reviews_summary: hist.customer_reviews_summary,
          action_plan: hist.action_plan
        },
        health_score: hist.health_score,
        total_sales: hist.sales_data.reduce((acc: number, item: any) => acc + item.sales, 0),
        total_transactions: hist.sales_data.reduce((acc: number, item: any) => acc + item.transactions, 0),
        top_products: hist.top_products,
        inventory_alerts: hist.alerts,
        customer_sentiment: hist.customer_reviews_summary,
        customer_reviews_summary: hist.customer_reviews_summary,
        action_plan: hist.action_plan,
        risk_level: hist.health_score >= 85 ? 'Excellent' : hist.health_score >= 70 ? 'Good' : 'Warning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    await this.writeJsonFile(HISTORY_FILE_PATH, [...seededHistoryRecords, ...preservedHist]);

    // 4. Seed Forecasting snapshot
    const currentForecast = await this.readJsonFile<any[]>(FORECAST_FILE_PATH, []);
    const preservedForecast = currentForecast.filter((f) => f.business_id !== activeBusinessId);

    // Build perfect high-fidelity Forecast Snapshot fields
    const fullForecastSnapshot = {
      id: `fore_demo_${scenarioId}`,
      business_id: activeBusinessId,
      forecast_range: '7d' as const,
      projected_revenue: scenario.history[0].sales_data.reduce((acc: number, i: any) => acc + i.sales, 0) * 1.12,
      projected_transactions: scenario.history[0].sales_data.reduce((acc: number, i: any) => acc + i.transactions, 0) * 1.1,
      risk_level: scenario.forecast.predicted_score >= 85 ? 'Low' : 'Medium',
      confidence_level: 'High' as const,
      sales_forecast: scenario.history[0].sales_data.map((item: any, idx: number) => ({
        date: item.date,
        projectedSales: Math.round(item.sales * (1 + (idx * 0.02))),
        baselineSales: item.sales
      })),
      inventory_forecast: scenario.history[0].top_products.map((item: any) => ({
        name: item.name,
        currentStock: item.stock,
        daysToStockout: item.stock < 10 ? 2 : 14,
        riskLevel: item.stock < 10 ? 'Critical' : 'Low',
        recommendedReorder: item.stock < 10 ? 100 : 0,
        suggestedAction: item.stock < 10 ? `Hubungi pemasok segera untuk restock ${item.name}` : 'Stok terjaga baik'
      })),
      crm_forecast: scenario.leads.map((l: any) => ({
        leadName: l.lead_name,
        stage: l.pipeline_stage,
        probability: l.interest_level === 'Hot' ? 85 : 55,
        estimatedValue: l.estimated_value,
        nextAction: `Follow up via manual/otomatis WhatsApp: ${l.notes.substring(0, 30)}...`,
        urgency: l.interest_level === 'Hot' ? 'High' : 'Medium'
      })),
      risk_radar: {
        salesRisk: scenarioId === 'laundry' ? 'Medium' : 'Low',
        inventoryRisk: scenarioId === 'kopi' ? 'High' : 'Low',
        customerSentimentRisk: scenarioId === 'fashion' ? 'Medium' : 'Low',
        crmPipelineRisk: 'Low',
        operationalExecutionRisk: 'Low'
      },
      ai_recommendations: {
        whyMatters: `Berdasarkan skenario ${scenario.title}, juri dapat mengamati optimasi model yang cerdas secara real-time.`,
        causes: [`Kondisi operasional ${businessData.business_type} membutuhkan restrukturisasi alur rantai pasok.`],
        shortTerm: [`Terapkan checklist Action Plan Prioritas Tinggi dalam 24 jam.`],
        mediumTerm: [`Pantau feedback chat WhatsApp dengan sentimen analisis mingguan.`],
        monitorNext: [`Integrasi automation Fonnte secara merata.`]
      },
      scenario_config: {
        expectedDailyGrowth: scenario.forecast.growth_index - 1,
        stockReorderDelayDays: 3,
        leadConversionRate: 0.2,
        promoBoost: 0.05
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await this.writeJsonFile(FORECAST_FILE_PATH, [fullForecastSnapshot, ...preservedForecast]);

    // 5. Seed Notifications
    const currentNotifs = await this.readJsonFile<any[]>(NOTIFICATIONS_FILE_PATH, []);
    const preservedNotifs = currentNotifs.filter((n) => n.business_id !== activeBusinessId);
    const configuredNotifs = scenario.notifications.map((n) => ({
      id: n.id,
      business_id: activeBusinessId,
      type: n.type,
      title: n.title,
      message: n.message,
      status: 'unread' as const,
      priority: 'high' as const,
      metadata: {},
      created_at: new Date().toISOString()
    }));
    await this.writeJsonFile(NOTIFICATIONS_FILE_PATH, [...configuredNotifs, ...preservedNotifs]);

    console.log(`[DEMO SEEDER] Skenario "${scenario.title}" berhasil di-seed lokal.`);

    // 6. DB Supabase seeding if configured
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          console.log('[DEMO SEEDER] Mencoba menyinkronkan data demo ke database Supabase...');
          
          // Upsert business profile
          await supabase.from('business_profiles').upsert({
            id: activeBusinessId,
            business_name: businessData.business_name,
            business_type: businessData.business_type,
            owner_name: businessData.owner_name,
            location: businessData.location,
            currency: businessData.currency,
            phone: businessData.phone,
            email: businessData.email,
            description: businessData.description,
            updated_at: new Date().toISOString()
          });

          // Insert analysis history record
          for (const sHist of seededHistoryRecords) {
            await supabase.from('analysis_history').upsert({
              analysis_id: sHist.analysis_id,
              business_id: activeBusinessId,
              business_name: sHist.business_name,
              business_type: sHist.business_type,
              input_source: sHist.input_source,
              raw_input_summary: sHist.raw_input_summary,
              ai_result: sHist.ai_result,
              health_score: sHist.health_score,
              total_sales: sHist.total_sales,
              total_transactions: sHist.total_transactions,
              top_products: sHist.top_products,
              inventory_alerts: sHist.inventory_alerts,
              customer_sentiment: sHist.customer_sentiment,
              action_plan: sHist.action_plan,
              risk_level: sHist.risk_level,
              created_at: sHist.created_at,
              updated_at: sHist.updated_at
            });
          }

          // Insert leads
          for (const sLead of configuredLeads) {
            await supabase.from('crm_leads').upsert({
              id: sLead.id,
              business_id: activeBusinessId,
              lead_name: sLead.lead_name,
              company_name: sLead.company_name,
              phone: sLead.phone,
              email: sLead.email,
              source: sLead.source,
              notes: sLead.notes,
              pipeline_stage: sLead.pipeline_stage,
              estimated_value: sLead.estimated_value,
              interest_level: sLead.interest_level,
              status: sLead.status,
              created_at: sLead.created_at
            });
          }

          console.log('[DEMO SEEDER] Skenario berhasil dipropagasikan ke Supabase secara real-time!');
        } catch (dbErr) {
          console.warn('[DEMO SEEDER] Sinkronisasi Supabase terhambat atau tabel skema belum lengkap. Fallback local sukses.', dbErr);
        }
      }
    }

    return true;
  }

  /**
   * Reset the active workspace back to default representation
   */
  static async resetDemo(activeBusinessId: string = 'local_profile_id'): Promise<boolean> {
    console.log(`[DEMO SEEDER] Memulai reset demo workspace untuk: ${activeBusinessId}`);

    const defaultProfile = {
      id: activeBusinessId,
      business_name: 'Kopi Selaras Cilandak',
      business_type: 'F&B Cafe',
      owner_name: 'Budi Santoso',
      location: 'Cilandak, Jakarta Selatan',
      currency: 'IDR',
      phone: '+62 812-3456-7890',
      email: 'kontak@kopiselaras.com',
      description: 'Kedai kopi artisan lokal dengan nuansa asri, menyajikan biji kopi Nusantara berkualitas tinggi untuk penikmat kopi urban.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const currentProfiles = await this.readJsonFile<any[]>(PROFILE_FILE_PATH, []);
    await this.writeJsonFile(PROFILE_FILE_PATH, [
      defaultProfile,
      ...currentProfiles.filter((profile) => profile.id !== activeBusinessId)
    ]);

    const currentLeads = await this.readJsonFile<any[]>(LEADS_FILE_PATH, []);
    await this.writeJsonFile(LEADS_FILE_PATH, currentLeads.filter((lead) => lead.business_id !== activeBusinessId));

    const currentHistory = await this.readJsonFile<any[]>(HISTORY_FILE_PATH, []);
    await this.writeJsonFile(HISTORY_FILE_PATH, currentHistory.filter((history) => history.business_id !== activeBusinessId));

    const currentForecast = await this.readJsonFile<any[]>(FORECAST_FILE_PATH, []);
    await this.writeJsonFile(FORECAST_FILE_PATH, currentForecast.filter((forecast) => forecast.business_id !== activeBusinessId));

    const currentNotifications = await this.readJsonFile<any[]>(NOTIFICATIONS_FILE_PATH, []);
    await this.writeJsonFile(NOTIFICATIONS_FILE_PATH, currentNotifications.filter((notification) => notification.business_id !== activeBusinessId));

    // Also remove from Supabase if active
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('crm_leads').delete().eq('business_id', activeBusinessId);
          await supabase.from('analysis_history').delete().eq('business_id', activeBusinessId);
          await supabase.from('business_profiles').upsert(defaultProfile);
        } catch (dbErr) {
          console.warn('[DEMO SEEDER] Supabase deletes skipped during reset:', dbErr);
        }
      }
    }

    return true;
  }
}
