import { runSupabaseQuery } from '../db/supabaseClient';

export interface AutomationRule {
  id: string;
  business_id?: string | null;
  rule_type: string;
  is_active: boolean;
  trigger_config: {
    threshold_value?: number;
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

export class AutomationRepository {
  static async getAll(businessId?: string | null): Promise<AutomationRule[]> {
    const data = await runSupabaseQuery<AutomationRule[]>('automation_rules.getAll', (supabase) => {
      let query = supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: true });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return data || [];
  }

  static async create(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationRule> {
    const data = await runSupabaseQuery<AutomationRule>('automation_rules.create', (supabase) =>
      supabase
        .from('automation_rules')
        .insert({
          business_id: rule.business_id || null,
          rule_type: rule.rule_type,
          is_active: rule.is_active,
          trigger_config: rule.trigger_config || {},
          action_config: rule.action_config || {},
        })
        .select('*')
        .single()
    );

    return data;
  }

  static async update(
    id: string,
    updates: Partial<Omit<AutomationRule, 'id' | 'created_at'>>,
    businessId?: string | null
  ): Promise<AutomationRule | null> {
    const data = await runSupabaseQuery<AutomationRule | null>('automation_rules.update', (supabase) => {
      let query = supabase
        .from('automation_rules')
        .update({
          rule_type: updates.rule_type,
          is_active: updates.is_active,
          trigger_config: updates.trigger_config,
          action_config: updates.action_config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query.select('*').maybeSingle();
    });

    return data || null;
  }

  static async delete(id: string, businessId?: string | null): Promise<boolean> {
    await runSupabaseQuery<null>('automation_rules.delete', (supabase) => {
      let query = supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return true;
  }
}
