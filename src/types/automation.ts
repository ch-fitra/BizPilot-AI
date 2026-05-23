export interface AutomationRule {
  id: string;
  business_id?: string | null;
  rule_type: 'lead_overdue' | 'stock_critical' | 'lead_score_high' | string;
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
