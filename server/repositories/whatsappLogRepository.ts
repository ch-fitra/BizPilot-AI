import { runSupabaseQuery } from '../db/supabaseClient';

export interface WhatsAppLog {
  id: string;
  business_id?: string | null;
  recipient: string;
  message: string;
  status: 'sent' | 'failed';
  provider: 'simulation' | 'fonnte' | 'whatsapp_cloud_api';
  sent_at?: string;
  metadata?: any;
}

export class WhatsAppLogRepository {
  static async getAll(businessId?: string | null): Promise<WhatsAppLog[]> {
    const data = await runSupabaseQuery<WhatsAppLog[]>('whatsapp_logs.getAll', (supabase) => {
      let query = supabase
        .from('whatsapp_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return data || [];
  }

  static async create(log: Omit<WhatsAppLog, 'id' | 'sent_at'>): Promise<WhatsAppLog> {
    const data = await runSupabaseQuery<WhatsAppLog>('whatsapp_logs.create', (supabase) =>
      supabase
        .from('whatsapp_logs')
        .insert({
          business_id: log.business_id || null,
          recipient: log.recipient,
          message: log.message,
          status: log.status,
          provider: log.provider,
          metadata: log.metadata || {},
        })
        .select('*')
        .single()
    );

    return data;
  }
}
