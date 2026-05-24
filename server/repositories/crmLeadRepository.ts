import { runSupabaseQuery } from '../db/supabaseClient';

export interface CRMLead {
  id: string;
  business_id?: string | null;
  lead_name: string;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
  pipeline_stage: 'New Lead' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost';
  estimated_value: number;
  lead_score: number;
  interest_level: 'Cold' | 'Warm' | 'Hot';
  tags?: string[] | null;
  next_follow_up?: string | null;
  last_activity?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CRMActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  notes: string;
  created_at: string;
}

export class CRMLeadRepository {
  public static calculateLeadScore(lead: Partial<CRMLead>): number {
    let score = 50;

    if (lead.interest_level === 'Hot') score += 25;
    else if (lead.interest_level === 'Cold') score -= 20;
    else score += 5;

    switch (lead.pipeline_stage) {
      case 'Contacted':
        score += 10;
        break;
      case 'Qualified':
        score += 20;
        break;
      case 'Negotiation':
        score += 30;
        break;
      case 'Won':
        return 100;
      case 'Lost':
        return 0;
      default:
        break;
    }

    const val = lead.estimated_value || 0;
    if (val > 10000000) score += 10;
    else if (val > 3000000) score += 5;
    else if (val < 500000) score -= 5;

    if (lead.email && lead.phone) score += 5;
    else if (!lead.email && !lead.phone) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private static mapLead(row: any): CRMLead {
    return {
      ...row,
      estimated_value: Number(row.estimated_value || 0),
      lead_score: Number(row.lead_score || 0),
      tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags) : []),
    } as CRMLead;
  }

  static async getAll(businessId?: string | null): Promise<CRMLead[]> {
    const data = await runSupabaseQuery<any[]>('crm_leads.getAll', (supabase) => {
      let query = supabase
        .from('crm_leads')
        .select('*')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return (data || []).map((item) => this.mapLead(item));
  }

  static async getById(id: string, businessId?: string | null): Promise<CRMLead | null> {
    const data = await runSupabaseQuery<any | null>('crm_leads.getById', (supabase) => {
      let query = supabase
        .from('crm_leads')
        .select('*')
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query.maybeSingle();
    });

    return data ? this.mapLead(data) : null;
  }

  static async createLead(lead: Omit<CRMLead, 'id' | 'lead_score' | 'created_at' | 'updated_at'>): Promise<CRMLead> {
    const calculatedScore = this.calculateLeadScore(lead);
    const lastActivity = new Date().toISOString();

    const data = await runSupabaseQuery<any>('crm_leads.createLead', (supabase) =>
      supabase
        .from('crm_leads')
        .insert({
          business_id: lead.business_id || null,
          lead_name: lead.lead_name,
          company_name: lead.company_name || null,
          phone: lead.phone || null,
          email: lead.email || null,
          source: lead.source || null,
          notes: lead.notes || null,
          pipeline_stage: lead.pipeline_stage || 'New Lead',
          estimated_value: lead.estimated_value || 0,
          lead_score: calculatedScore,
          interest_level: lead.interest_level || 'Warm',
          tags: lead.tags || [],
          next_follow_up: lead.next_follow_up || null,
          last_activity: lastActivity,
          status: lead.status || 'active',
        })
        .select('*')
        .single()
    );

    await this.addActivity(data.id, 'status_change', `Lead dibuat dengan Pipeline Stage: ${data.pipeline_stage}. Skor Awal AI: ${data.lead_score}.`);
    return this.mapLead(data);
  }

  static async updateLead(
    id: string,
    updates: Partial<Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>>,
    businessId?: string | null
  ): Promise<CRMLead | null> {
    const existing = await this.getById(id, businessId);
    if (!existing) return null;

    const proposed = { ...existing, ...updates };
    const calculatedScore = this.calculateLeadScore(proposed);
    const nowIso = new Date().toISOString();

    const data = await runSupabaseQuery<any | null>('crm_leads.updateLead', (supabase) => {
      let query = supabase
        .from('crm_leads')
        .update({
          lead_name: proposed.lead_name,
          company_name: proposed.company_name || null,
          phone: proposed.phone || null,
          email: proposed.email || null,
          source: proposed.source || null,
          notes: proposed.notes || null,
          pipeline_stage: proposed.pipeline_stage,
          estimated_value: proposed.estimated_value,
          lead_score: calculatedScore,
          interest_level: proposed.interest_level,
          tags: proposed.tags,
          next_follow_up: proposed.next_follow_up || null,
          last_activity: nowIso,
          status: proposed.status,
          updated_at: nowIso,
        })
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query.select('*').maybeSingle();
    });

    if (!data) return null;

    if (existing.pipeline_stage !== proposed.pipeline_stage) {
      await this.addActivity(id, 'status_change', `Pipeline bermutasi dari [${existing.pipeline_stage}] menjadi [${proposed.pipeline_stage}].`);
    }
    if (existing.lead_score !== calculatedScore) {
      await this.addActivity(id, 'score_update', `Skor dihitung ulang AI dari ${existing.lead_score} ke ${calculatedScore}.`);
    }

    return this.mapLead(data);
  }

  static async deleteLead(id: string, businessId?: string | null): Promise<boolean> {
    await runSupabaseQuery<null>('crm_leads.deleteLead', (supabase) => {
      let query = supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return true;
  }

  static async getActivitiesByLeadId(leadId: string): Promise<CRMActivity[]> {
    const data = await runSupabaseQuery<CRMActivity[]>('crm_activities.getActivitiesByLeadId', (supabase) =>
      supabase
        .from('crm_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
    );

    return data || [];
  }

  static async addActivity(leadId: string, type: string, notes: string): Promise<CRMActivity> {
    const data = await runSupabaseQuery<CRMActivity>('crm_activities.addActivity', (supabase) =>
      supabase
        .from('crm_activities')
        .insert({
          lead_id: leadId,
          activity_type: type,
          notes,
        })
        .select('*')
        .single()
    );

    return data;
  }
}
