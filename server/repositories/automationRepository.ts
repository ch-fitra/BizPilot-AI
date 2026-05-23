import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

export interface AutomationRule {
  id: string;
  business_id?: string | null;
  rule_type: string; // 'lead_overdue', 'stock_critical', 'lead_score_high'
  is_active: boolean;
  trigger_config: {
    threshold_value?: number; // e.g. days overdue, stock level limit, score limit
    [key: string]: any;
  };
  action_config: {
    send_whatsapp?: boolean;
    notify_dashboard?: boolean;
    template_type?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

const AUTOMATION_RULES_FILE_PATH = path.join(process.cwd(), 'automation_rules.json');

export class AutomationRepository {
  private static async ensureLocalFileExists(): Promise<void> {
    try {
      await fs.access(AUTOMATION_RULES_FILE_PATH);
    } catch {
      // Pre-seed with beautiful automated trigger templates for a live expert experience
      const defaultRules: AutomationRule[] = [
        {
          id: 'rule_demo_1',
          business_id: 'local_profile_id',
          rule_type: 'lead_overdue',
          is_active: true,
          trigger_config: { threshold_value: 1 }, // overdue > 1 day
          action_config: { send_whatsapp: false, notify_dashboard: true, template_type: 'followup_reminder' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'rule_demo_2',
          business_id: 'local_profile_id',
          rule_type: 'stock_critical',
          is_active: true,
          trigger_config: { threshold_value: 5 }, // stock < 5 units
          action_config: { send_whatsapp: false, notify_dashboard: true, template_type: 'inventory_alert' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'rule_demo_3',
          business_id: 'local_profile_id',
          rule_type: 'lead_score_high',
          is_active: true,
          trigger_config: { threshold_value: 80 }, // score >= 80%
          action_config: { send_whatsapp: false, notify_dashboard: true, template_type: 'hot_lead_alert' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      await fs.writeFile(AUTOMATION_RULES_FILE_PATH, JSON.stringify(defaultRules, null, 2), 'utf-8');
    }
  }

  static async getAll(businessId?: string | null): Promise<AutomationRule[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase
            .from('automation_rules')
            .select('*')
            .order('created_at', { ascending: true });

          if (businessId) {
            query = query.eq('business_id', businessId);
          }

          const { data, error } = await query;
          if (error) {
            const isMissingTable = error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
              console.warn('⚠️ automation_rules table is missing. Falling back to local JSON for automation rules.');
            } else {
              console.error('Supabase query error retrieving automation rules:', error.message);
            }
          } else if (data) {
            return data as AutomationRule[];
          }
        } catch (err) {
          console.error('Exception and Supabase fallback in getAll automation rules:', err);
        }
      }
    }

    // Fallback file reading
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(AUTOMATION_RULES_FILE_PATH, 'utf-8');
      const allRules = JSON.parse(raw) as AutomationRule[];
      if (businessId) {
        return allRules.filter(r => r.business_id === businessId || !r.business_id || r.business_id === 'local_profile_id');
      }
      return allRules;
    } catch (err) {
      console.error('Error reading local automation rules file:', err);
      return [];
    }
  }

  static async create(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationRule> {
    const isLocal = !(isSupabaseConfigured && !isSchemaMissing);
    const freshRule: AutomationRule = {
      id: isLocal ? `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` : (undefined as any),
      ...rule,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('automation_rules')
            .insert({
              business_id: rule.business_id || null,
              rule_type: rule.rule_type,
              is_active: rule.is_active,
              trigger_config: rule.trigger_config || {},
              action_config: rule.action_config || {}
            })
            .select('*')
            .single();

          if (error) {
            console.error('Supabase error creating automation rule, using fallback:', error.message);
          } else if (data) {
            return data as AutomationRule;
          }
        } catch (err) {
          console.error('Exception in DB create automation rule:', err);
        }
      }
    }

    // Fallback save to file
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(AUTOMATION_RULES_FILE_PATH, 'utf-8');
      const allRules = JSON.parse(raw) as AutomationRule[];
      allRules.push(freshRule);
      await fs.writeFile(AUTOMATION_RULES_FILE_PATH, JSON.stringify(allRules, null, 2), 'utf-8');
      return freshRule;
    } catch (err) {
      console.error('Error writing local automation rule:', err);
      return freshRule;
    }
  }

  static async update(id: string, updates: Partial<Omit<AutomationRule, 'id' | 'created_at'>>): Promise<AutomationRule | null> {
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('automation_rules')
            .update({
              rule_type: updates.rule_type,
              is_active: updates.is_active,
              trigger_config: updates.trigger_config,
              action_config: updates.action_config,
              updated_at: nowIso
            })
            .eq('id', id)
            .select('*')
            .single();

          if (!error && data) {
            return data as AutomationRule;
          }
          console.error('Supabase error updating automation rule:', error?.message);
        } catch (err) {
          console.error('Exception in DB update automation rule:', err);
        }
      }
    }

    // Fallback file update
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(AUTOMATION_RULES_FILE_PATH, 'utf-8');
      const allRules = JSON.parse(raw) as AutomationRule[];
      let updatedRule: AutomationRule | null = null;
      
      const updated = allRules.map(r => {
        if (r.id === id) {
          updatedRule = {
            ...r,
            ...updates,
            updated_at: nowIso
          };
          return updatedRule;
        }
        return r;
      });

      await fs.writeFile(AUTOMATION_RULES_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
      return updatedRule;
    } catch (err) {
      console.error('Error updating local automation rule:', err);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('automation_rules')
            .delete()
            .eq('id', id);

          if (!error) return true;
          console.error('Supabase error deleting automation rule:', error.message);
        } catch (err) {
          console.error('Exception in DB delete automation rule:', err);
        }
      }
    }

    // Fallback file delete
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(AUTOMATION_RULES_FILE_PATH, 'utf-8');
      const allRules = JSON.parse(raw) as AutomationRule[];
      const filtered = allRules.filter(r => r.id !== id);
      await fs.writeFile(AUTOMATION_RULES_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error deleting local automation rule:', err);
      return false;
    }
  }
}
