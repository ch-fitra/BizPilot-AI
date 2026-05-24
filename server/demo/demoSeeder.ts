import { demoScenarios } from './demoScenarios';
import { runSupabaseQuery } from '../db/supabaseClient';

export class DemoSeeder {
  static async seedScenario(scenarioId: string, activeBusinessId: string): Promise<boolean> {
    if (!activeBusinessId) {
      throw new Error('Workspace bisnis aktif wajib tersedia sebelum menjalankan demo.');
    }

    const scenario = demoScenarios[scenarioId];
    if (!scenario) {
      console.error(`[DEMO SEEDER] Skenario "${scenarioId}" tidak terdaftar`);
      return false;
    }

    const now = new Date().toISOString();
    const businessData = {
      ...scenario.business,
      id: activeBusinessId,
      updated_at: now,
    };

    const seededHistoryRecords = scenario.history.map((hist) => ({
      business_id: activeBusinessId,
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
        action_plan: hist.action_plan,
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
      created_at: now,
      updated_at: now,
    }));

    const configuredLeads = scenario.leads.map((lead) => ({
      ...lead,
      business_id: activeBusinessId,
      created_at: now,
      updated_at: now,
    }));

    const fullForecastSnapshot = {
      business_id: activeBusinessId,
      forecast_range: '7d' as const,
      projected_revenue: scenario.history[0].sales_data.reduce((acc: number, i: any) => acc + i.sales, 0) * 1.12,
      projected_transactions: scenario.history[0].sales_data.reduce((acc: number, i: any) => acc + i.transactions, 0) * 1.1,
      risk_level: scenario.forecast.predicted_score >= 85 ? 'Low' : 'Medium',
      confidence_level: 'High' as const,
      sales_forecast: scenario.history[0].sales_data.map((item: any, idx: number) => ({
        date: item.date,
        projectedSales: Math.round(item.sales * (1 + (idx * 0.02))),
        baselineSales: item.sales,
      })),
      inventory_forecast: scenario.history[0].top_products.map((item: any) => ({
        name: item.name,
        currentStock: item.stock,
        daysToStockout: item.stock < 10 ? 2 : 14,
        riskLevel: item.stock < 10 ? 'Critical' : 'Low',
        recommendedReorder: item.stock < 10 ? 100 : 0,
        suggestedAction: item.stock < 10 ? `Hubungi pemasok segera untuk restock ${item.name}` : 'Stok terjaga baik',
      })),
      crm_forecast: scenario.leads.map((lead: any) => ({
        leadName: lead.lead_name,
        stage: lead.pipeline_stage,
        probability: lead.interest_level === 'Hot' ? 85 : 55,
        estimatedValue: lead.estimated_value,
        nextAction: `Follow up WhatsApp: ${lead.notes.substring(0, 30)}...`,
        urgency: lead.interest_level === 'Hot' ? 'High' : 'Medium',
      })),
      risk_radar: {
        salesRisk: scenarioId === 'laundry' ? 'Medium' : 'Low',
        inventoryRisk: scenarioId === 'kopi' ? 'High' : 'Low',
        customerSentimentRisk: scenarioId === 'fashion' ? 'Medium' : 'Low',
        crmPipelineRisk: 'Low',
        operationalExecutionRisk: 'Low',
      },
      ai_recommendations: {
        whyMatters: `Berdasarkan skenario ${scenario.title}, juri dapat mengamati optimasi model yang cerdas secara real-time.`,
        causes: [`Kondisi operasional ${businessData.business_type} membutuhkan restrukturisasi alur rantai pasok.`],
        shortTerm: ['Terapkan checklist Action Plan Prioritas Tinggi dalam 24 jam.'],
        mediumTerm: ['Pantau feedback chat WhatsApp dengan sentimen analisis mingguan.'],
        monitorNext: ['Integrasi automation Fonnte secara merata.'],
      },
      scenario_config: {
        expectedDailyGrowth: scenario.forecast.growth_index - 1,
        stockReorderDelayDays: 3,
        leadConversionRate: 0.2,
        promoBoost: 0.05,
      },
    };

    const configuredNotifs = scenario.notifications.map((notification) => ({
      business_id: activeBusinessId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      status: 'unread' as const,
      priority: 'high' as const,
      metadata: {},
      created_at: now,
    }));

    await runSupabaseQuery<null>('demo.seed.clear', (supabase) =>
      supabase.from('crm_leads').delete().eq('business_id', activeBusinessId)
    );
    await runSupabaseQuery<null>('demo.seed.clearHistory', (supabase) =>
      supabase.from('analysis_histories').delete().eq('business_id', activeBusinessId)
    );
    await runSupabaseQuery<null>('demo.seed.clearForecasts', (supabase) =>
      supabase.from('forecast_snapshots').delete().eq('business_id', activeBusinessId)
    );
    await runSupabaseQuery<null>('demo.seed.clearNotifications', (supabase) =>
      supabase.from('notifications').delete().eq('business_id', activeBusinessId)
    );

    await runSupabaseQuery('demo.seed.businessProfile', (supabase) =>
      supabase.from('business_profiles').upsert(businessData).select().single()
    );
    await runSupabaseQuery('demo.seed.history', (supabase) =>
      supabase.from('analysis_histories').insert(seededHistoryRecords).select()
    );
    await runSupabaseQuery('demo.seed.leads', (supabase) =>
      supabase.from('crm_leads').insert(configuredLeads).select()
    );
    await runSupabaseQuery('demo.seed.forecast', (supabase) =>
      supabase.from('forecast_snapshots').insert(fullForecastSnapshot).select().single()
    );
    await runSupabaseQuery('demo.seed.notifications', (supabase) =>
      supabase.from('notifications').insert(configuredNotifs).select()
    );

    return true;
  }

  static async resetDemo(activeBusinessId: string): Promise<boolean> {
    if (!activeBusinessId) {
      throw new Error('Workspace bisnis aktif wajib tersedia sebelum reset demo.');
    }

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
      updated_at: new Date().toISOString(),
    };

    await runSupabaseQuery<null>('demo.reset.leads', (supabase) =>
      supabase.from('crm_leads').delete().eq('business_id', activeBusinessId)
    );
    await runSupabaseQuery<null>('demo.reset.history', (supabase) =>
      supabase.from('analysis_histories').delete().eq('business_id', activeBusinessId)
    );
    await runSupabaseQuery<null>('demo.reset.forecasts', (supabase) =>
      supabase.from('forecast_snapshots').delete().eq('business_id', activeBusinessId)
    );
    await runSupabaseQuery<null>('demo.reset.notifications', (supabase) =>
      supabase.from('notifications').delete().eq('business_id', activeBusinessId)
    );
    await runSupabaseQuery('demo.reset.profile', (supabase) =>
      supabase.from('business_profiles').upsert(defaultProfile).select().single()
    );

    return true;
  }
}
