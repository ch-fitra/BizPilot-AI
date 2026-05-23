import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

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
  status: string; // 'active' or 'archived'
  created_at?: string;
  updated_at?: string;
}

export interface CRMActivity {
  id: string;
  lead_id: string;
  activity_type: string; // 'call', 'email', 'meeting', 'note', 'status_change', 'score_update'
  notes: string;
  created_at: string;
}

const LEADS_FILE_PATH = path.join(process.cwd(), 'crm_leads.json');
const ACTIVITIES_FILE_PATH = path.join(process.cwd(), 'crm_activities.json');

export class CRMLeadRepository {
  private static async ensureLocalFilesExist(): Promise<void> {
    try {
      await fs.access(LEADS_FILE_PATH);
    } catch {
      // Default demo leads pre-population for smooth UMKM experience
      const demoLeads: CRMLead[] = [
        {
          id: 'lead_demo_1',
          business_id: 'local_profile_id',
          lead_name: 'Anto Wijaya',
          company_name: 'Catering Selera Mandiri',
          phone: '0812-9876-5432',
          email: 'anto@cateringmandiri.id',
          source: 'Instagram Ads',
          notes: 'Tertarik pesan kopi kemasan botol 1 Liter sebanyak 200 botol untuk event gathering kelurahan kantor minggu depan. Butuh penawaran diskon.',
          pipeline_stage: 'Negotiation',
          estimated_value: 4500000,
          lead_score: 85,
          interest_level: 'Hot',
          tags: ['B2B', 'Grosir', 'Event'],
          next_follow_up: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          last_activity: new Date().toISOString(),
          status: 'active',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'lead_demo_2',
          business_id: 'local_profile_id',
          lead_name: 'Siti Rahma',
          company_name: 'Franchise Kopi Ibu',
          phone: '0856-1122-3344',
          email: 'siti.rahma@gmail.com',
          source: 'WhatsApp',
          notes: 'Tanya brosur kemitraan biji kopi house blend. Sudah dikirimi lewat WA, menunggu callback.',
          pipeline_stage: 'Contacted',
          estimated_value: 1200000,
          lead_score: 55,
          interest_level: 'Warm',
          tags: ['Reseller', 'Biji Kopi'],
          next_follow_up: new Date(Date.now() - 36400000).toISOString(), // Yesterday (Overdue)
          last_activity: new Date(Date.now() - 2 * 86400000).toISOString(),
          status: 'active',
          created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'lead_demo_3',
          business_id: 'local_profile_id',
          lead_name: 'David Christian',
          company_name: 'Hotel Grand Nusantara',
          phone: '0821-4433-2211',
          email: 'purchasing@grandnusantara.com',
          source: 'Website Walk-in',
          notes: 'Minta paket tester produk house blend espresso roast untuk disajikan di coffee corner hotel.',
          pipeline_stage: 'Qualified',
          estimated_value: 15500000,
          lead_score: 75,
          interest_level: 'Hot',
          tags: ['Corporate', 'Hotel', 'Premium'],
          next_follow_up: new Date(Date.now() + 3 * 86400000).toISOString(), // Upcoming
          last_activity: new Date().toISOString(),
          status: 'active',
          created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'lead_demo_4',
          business_id: 'local_profile_id',
          lead_name: 'Rian Hidayat',
          company_name: 'Personal Buy',
          phone: '0878-5544-3322',
          email: 'rian_h@yahoo.com',
          source: 'Google Maps',
          notes: 'Ingin memesan alat seduh manual V60 set lengkap dengan scale.',
          pipeline_stage: 'New Lead',
          estimated_value: 650000,
          lead_score: 30,
          interest_level: 'Cold',
          tags: ['Manual Brew', 'Retail'],
          next_follow_up: new Date(Date.now() + 5 * 86400000).toISOString(),
          last_activity: new Date().toISOString(),
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      await fs.writeFile(LEADS_FILE_PATH, JSON.stringify(demoLeads, null, 2), 'utf-8');
    }

    try {
      await fs.access(ACTIVITIES_FILE_PATH);
    } catch {
      const demoActivities: CRMActivity[] = [
        {
          id: 'act_demo_1',
          lead_id: 'lead_demo_1',
          activity_type: 'call',
          notes: 'Melakukan panggilan perkenalan dan mencocokkan jadwal pengiriman sampel kopi botolan ke kantor catering.',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          id: 'act_demo_2',
          lead_id: 'lead_demo_2',
          activity_type: 'email',
          notes: 'Mengirimkan PDF penawaran harga dan skema reseller biji kopi house blend.',
          created_at: new Date(Date.now() - 4 * 86400000).toISOString()
        }
      ];
      await fs.writeFile(ACTIVITIES_FILE_PATH, JSON.stringify(demoActivities, null, 2), 'utf-8');
    }
  }

  // Calculate high-fidelity MSME local score logic (0-100)
  public static calculateLeadScore(lead: Partial<CRMLead>): number {
    let score = 50; // Base starting average

    // 1. Interest Level contribution
    if (lead.interest_level === 'Hot') score += 25;
    else if (lead.interest_level === 'Cold') score -= 20;
    else score += 5; // Warm default bonus

    // 2. Stage progression boost
    switch (lead.pipeline_stage) {
      case 'New Lead':
        score += 0;
        break;
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
        return 100; // Hard max
      case 'Lost':
        return 0; // Hard min
      default:
        break;
    }

    // 3. Size estimation (Estimated deal value scale for MSMEs in Rupiah/Currency)
    const val = lead.estimated_value || 0;
    if (val > 10000000) score += 10; // Mega client for small businesses
    else if (val > 3000000) score += 5;
    else if (val < 500000) score -= 5; // Low touch retail leads

    // 4. Contact channel health bonus
    if (lead.email && lead.phone) score += 5;
    else if (!lead.email && !lead.phone) score -= 15; // Incomplete details

    // 5. Bounds correction
    return Math.max(0, Math.min(100, score));
  }

  // Get all leads
  static async getAll(businessId?: string | null): Promise<CRMLead[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase
            .from('crm_leads')
            .select('*')
            .order('created_at', { ascending: false });

          if (businessId) {
            query = query.eq('business_id', businessId);
          }

          const { data, error } = await query;
          if (error) {
            const isMissingTable = error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
              console.warn('⚠️ crm_leads table missing in database. Swapping automatically to JSON file storage.');
            } else {
              console.error('Supabase query error retrieving CRM leads:', error.message);
            }
          } else if (data) {
            return (data as any[]).map(item => ({
              ...item,
              tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? JSON.parse(item.tags) : [])
            })) as CRMLead[];
          }
        } catch (err) {
          console.error('Exception in load CRM leads on DB:', err);
        }
      }
    }

    // JSON fallback
    await this.ensureLocalFilesExist();
    try {
      const raw = await fs.readFile(LEADS_FILE_PATH, 'utf-8');
      const allLeads = JSON.parse(raw) as CRMLead[];
      if (businessId) {
        return allLeads.filter(l => l.business_id === businessId && l.status !== 'archived');
      }
      return allLeads.filter(l => l.status !== 'archived');
    } catch (err) {
      console.error('Error reading crm_leads local file fallback:', err);
      return [];
    }
  }

  // Get specific lead by ID
  static async getById(id: string): Promise<CRMLead | null> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('crm_leads')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            return {
              ...data,
              tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? JSON.parse(data.tags) : [])
            } as CRMLead;
          }
        } catch (err) {
          console.error(`Exception retrieving CRM lead ID ${id} in DB:`, err);
        }
      }
    }

    // JSON file fallback
    await this.ensureLocalFilesExist();
    try {
      const raw = await fs.readFile(LEADS_FILE_PATH, 'utf-8');
      const allLeads = JSON.parse(raw) as CRMLead[];
      const found = allLeads.find(l => l.id === id);
      return found || null;
    } catch (err) {
      console.error('Error reading single lead from local list:', err);
      return null;
    }
  }

  // Insert a new lead
  static async createLead(lead: Omit<CRMLead, 'id' | 'lead_score' | 'created_at' | 'updated_at'>): Promise<CRMLead> {
    const calculatedScore = this.calculateLeadScore(lead);

    const freshLead: CRMLead = {
      ...lead,
      id: isSupabaseConfigured && !isSchemaMissing ? undefined : `local_lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      lead_score: calculatedScore,
      last_activity: new Date().toISOString(),
      status: lead.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any;

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('crm_leads')
            .insert({
              business_id: freshLead.business_id || null,
              lead_name: freshLead.lead_name,
              company_name: freshLead.company_name || null,
              phone: freshLead.phone || null,
              email: freshLead.email || null,
              source: freshLead.source || null,
              notes: freshLead.notes || null,
              pipeline_stage: freshLead.pipeline_stage || 'New Lead',
              estimated_value: freshLead.estimated_value || 0,
              lead_score: freshLead.lead_score,
              interest_level: freshLead.interest_level || 'Warm',
              tags: freshLead.tags || [],
              next_follow_up: freshLead.next_follow_up || null,
              last_activity: freshLead.last_activity,
              status: 'active'
            })
            .select('*')
            .single();

          if (error) {
            console.error('Error inserting CRM lead in DB:', error.message);
            if (error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist')) {
              setSchemaMissing(true);
            }
          } else if (data) {
            // Log automatic creation log
            await this.addActivity(data.id, 'status_change', `Lead dibuat dengan Pipeline Stage: ${data.pipeline_stage}. Skor Awal AI: ${data.lead_score}.`);
            return data as CRMLead;
          }
        } catch (err) {
          console.error('Exception committing new CRM lead on DB:', err);
        }
      }
    }

    // JSON file fallback
    await this.ensureLocalFilesExist();
    try {
      const raw = await fs.readFile(LEADS_FILE_PATH, 'utf-8');
      const allLeads = JSON.parse(raw) as CRMLead[];
      allLeads.push(freshLead);
      await fs.writeFile(LEADS_FILE_PATH, JSON.stringify(allLeads, null, 2), 'utf-8');
      
      await this.addActivity(freshLead.id, 'status_change', `Lead dibuat dengan stage: ${freshLead.pipeline_stage}. Skor Awal: ${freshLead.lead_score}.`);
      return freshLead;
    } catch (err) {
      console.error('Error writing to local crm_leads fallback:', err);
      return freshLead;
    }
  }

  // Update a lead (and recompute AI scoring dynamically)
  static async updateLead(id: string, updates: Partial<Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>>): Promise<CRMLead | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    // Build proposed record to score
    const proposed = { ...existing, ...updates };
    const calculatedScore = this.calculateLeadScore(proposed);
    proposed.lead_score = calculatedScore;
    proposed.updated_at = new Date().toISOString();
    proposed.last_activity = new Date().toISOString();

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
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
              lead_score: proposed.lead_score,
              interest_level: proposed.interest_level,
              tags: proposed.tags,
              next_follow_up: proposed.next_follow_up || null,
              last_activity: proposed.last_activity,
              status: proposed.status,
              updated_at: proposed.updated_at
            })
            .eq('id', id)
            .select('*')
            .single();

          if (error) {
            console.error(`Error updating CRM lead ID ${id} in DB:`, error.message);
          } else if (data) {
            // Log changes
            if (existing.pipeline_stage !== proposed.pipeline_stage) {
              await this.addActivity(id, 'status_change', `Pipeline bermutasi dari [${existing.pipeline_stage}] menjadi [${proposed.pipeline_stage}].`);
            }
            if (existing.lead_score !== proposed.lead_score) {
              await this.addActivity(id, 'score_update', `Skor dihitung ulang AI dari ${existing.lead_score} ke ${proposed.lead_score}.`);
            }
            return data as CRMLead;
          }
        } catch (err) {
          console.error(`Exception updating CRM lead ID ${id} on DB:`, err);
        }
      }
    }

    // fallback JSON update
    try {
      const raw = await fs.readFile(LEADS_FILE_PATH, 'utf-8');
      const allLeads = JSON.parse(raw) as CRMLead[];
      const idx = allLeads.findIndex(l => l.id === id);
      if (idx !== -1) {
        allLeads[idx] = proposed;
        await fs.writeFile(LEADS_FILE_PATH, JSON.stringify(allLeads, null, 2), 'utf-8');

        if (existing.pipeline_stage !== proposed.pipeline_stage) {
          await this.addActivity(id, 'status_change', `Pipeline bermutasi dari [${existing.pipeline_stage}] menjadi [${proposed.pipeline_stage}].`);
        }
        if (existing.lead_score !== proposed.lead_score) {
          await this.addActivity(id, 'score_update', `Skor dihitung ulang AI dari ${existing.lead_score} menjadi ${proposed.lead_score}.`);
        }
        return proposed;
      }
    } catch (err) {
      console.error('Error writing CRM updates to fallback file:', err);
    }
    return null;
  }

  // Delete a lead (hard delete)
  static async deleteLead(id: string): Promise<boolean> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('crm_leads')
            .delete()
            .eq('id', id);

          if (!error) {
            return true;
          }
        } catch (err) {
          console.error(`Exception erasing CRM lead ID ${id} in DB:`, err);
        }
      }
    }

    // Fallback JSON
    await this.ensureLocalFilesExist();
    try {
      const raw = await fs.readFile(LEADS_FILE_PATH, 'utf-8');
      const allLeads = JSON.parse(raw) as CRMLead[];
      const filtered = allLeads.filter(l => l.id !== id);
      if (filtered.length !== allLeads.length) {
        await fs.writeFile(LEADS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
        return true;
      }
    } catch (err) {
      console.error('Error deleting from fallback file:', err);
    }
    return false;
  }

  // List activities for a lead
  static async getActivitiesByLeadId(leadId: string): Promise<CRMActivity[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('crm_activities')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data as CRMActivity[];
          }
        } catch (err) {
          console.error(`Exception getting activities for ${leadId}:`, err);
        }
      }
    }

    // JSON file fallback
    await this.ensureLocalFilesExist();
    try {
      const raw = await fs.readFile(ACTIVITIES_FILE_PATH, 'utf-8');
      const allActivities = JSON.parse(raw) as CRMActivity[];
      return allActivities
        .filter(act => act.lead_id === leadId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      console.error('Error reading activities fallback:', err);
      return [];
    }
  }

  // Add an activity log
  static async addActivity(leadId: string, type: string, notes: string): Promise<CRMActivity> {
    const rawRecord: Omit<CRMActivity, 'id' | 'created_at'> = {
      lead_id: leadId,
      activity_type: type,
      notes,
    };

    const freshActivity: CRMActivity = {
      ...rawRecord,
      id: isSupabaseConfigured && !isSchemaMissing ? undefined : `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString()
    } as any;

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('crm_activities')
            .insert({
              lead_id: leadId,
              activity_type: type,
              notes
            })
            .select('*')
            .single();

          if (!error && data) {
            return data as CRMActivity;
          }
        } catch (err) {
          console.error('Exception writing crm_activity on DB:', err);
        }
      }
    }

    // fallback JSON append
    await this.ensureLocalFilesExist();
    try {
      const raw = await fs.readFile(ACTIVITIES_FILE_PATH, 'utf-8');
      const allActivities = JSON.parse(raw) as CRMActivity[];
      allActivities.push(freshActivity);
      await fs.writeFile(ACTIVITIES_FILE_PATH, JSON.stringify(allActivities, null, 2), 'utf-8');
      return freshActivity;
    } catch (err) {
      console.error('Error appending local activity fallback:', err);
      return freshActivity;
    }
  }
}
