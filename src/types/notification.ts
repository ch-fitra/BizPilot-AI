export interface NotificationRecord {
  id: string;
  business_id?: string | null;
  type: 'crm_followup' | 'inventory_alert' | 'action_plan' | 'ai_recommendation' | 'sales_alert' | 'daily_summary' | string;
  title: string;
  message: string;
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    lead_id?: string;
    lead_name?: string;
    company_name?: string;
    phone?: string;
    estimated_value?: number;
    interest_level?: string;
    overdue_days?: number;
    product_name?: string;
    current_stock?: number;
    threshold_limit?: number;
    task_id?: string;
    [key: string]: any;
  };
  created_at: string;
  read_at?: string | null;
}

export interface WhatsAppLog {
  id: string;
  business_id?: string | null;
  recipient: string;
  message: string;
  status: 'sent' | 'failed';
  provider: 'simulation' | 'fonnte' | 'whatsapp_cloud_api';
  sent_at: string;
  metadata?: {
    debug_log?: string;
    [key: string]: any;
  };
}
