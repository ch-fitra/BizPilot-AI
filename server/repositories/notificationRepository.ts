import { runSupabaseQuery } from '../db/supabaseClient';

export interface NotificationRecord {
  id: string;
  business_id?: string | null;
  type: string;
  title: string;
  message: string;
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: any;
  created_at?: string;
  read_at?: string | null;
}

export class NotificationRepository {
  static async getAll(businessId?: string | null): Promise<NotificationRecord[]> {
    const data = await runSupabaseQuery<NotificationRecord[]>('notifications.getAll', (supabase) => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return data || [];
  }

  static async create(notif: Omit<NotificationRecord, 'id' | 'created_at' | 'status'>): Promise<NotificationRecord> {
    const data = await runSupabaseQuery<NotificationRecord>('notifications.create', (supabase) =>
      supabase
        .from('notifications')
        .insert({
          business_id: notif.business_id || null,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          priority: notif.priority || 'medium',
          metadata: notif.metadata || {},
        })
        .select('*')
        .single()
    );

    return data;
  }

  static async markAsRead(id: string, businessId?: string | null): Promise<NotificationRecord | null> {
    const data = await runSupabaseQuery<NotificationRecord | null>('notifications.markAsRead', (supabase) => {
      let query = supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', id);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query.select('*').maybeSingle();
    });

    return data || null;
  }

  static async markAllAsRead(businessId?: string | null): Promise<boolean> {
    await runSupabaseQuery<null>('notifications.markAllAsRead', (supabase) => {
      let query = supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('status', 'unread');

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return true;
  }

  static async delete(id: string, businessId?: string | null): Promise<boolean> {
    await runSupabaseQuery<null>('notifications.delete', (supabase) => {
      let query = supabase
        .from('notifications')
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
