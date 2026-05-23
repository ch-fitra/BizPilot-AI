import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

export interface NotificationRecord {
  id: string;
  business_id?: string | null;
  type: string; // 'crm_followup', 'inventory_alert', 'action_plan', 'ai_recommendation', 'sales_alert', 'daily_summary'
  title: string;
  message: string;
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: any;
  created_at?: string;
  read_at?: string | null;
}

const NOTIFICATIONS_FILE_PATH = path.join(process.cwd(), 'notifications.json');

export class NotificationRepository {
  private static async ensureLocalFileExists(): Promise<void> {
    try {
      await fs.access(NOTIFICATIONS_FILE_PATH);
    } catch {
      // Pre-populate with beautiful initial notifications for a live experience
      const initialNotifications: NotificationRecord[] = [
        {
          id: 'notif_demo_1',
          business_id: 'local_profile_id',
          type: 'crm_followup',
          title: '🚨 Jadwal Follow-Up Overdue!',
          message: 'Hubungi prospek Siti Rahma (Franchise Kopi Ibu). Jadwal follow-up terlewati sejak kemarin!',
          status: 'unread',
          priority: 'high',
          metadata: { lead_id: 'lead_demo_2', value: 1200000 },
          created_at: new Date(Date.now() - 36400000).toISOString()
        },
        {
          id: 'notif_demo_2',
          business_id: 'local_profile_id',
          type: 'inventory_alert',
          title: '⚠️ Peringatan Stok Kritis!',
          message: 'Bahan baku Robusta Gayo tinggal 2 unit. Berada di bawah ambang batas minimal (10 unit). Segera restock untuk menjaga kapasitas produksi.',
          status: 'unread',
          priority: 'critical',
          metadata: { product_name: 'Robusta Gayo', stock: 2 },
          created_at: new Date(Date.now() - 4 * 3600000).toISOString()
        },
        {
          id: 'notif_demo_3',
          business_id: 'local_profile_id',
          type: 'action_plan',
          title: '📋 Agenda Action Plan Hari Ini',
          message: 'Tindak lanjuti rencana pemasaran promosi paket hemat weekend di GoFood/GrabFood.',
          status: 'unread',
          priority: 'medium',
          metadata: { task_id: 'task_demo_1' },
          created_at: new Date().toISOString()
        }
      ];
      await fs.writeFile(NOTIFICATIONS_FILE_PATH, JSON.stringify(initialNotifications, null, 2), 'utf-8');
    }
  }

  static async getAll(businessId?: string | null): Promise<NotificationRecord[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase
            .from('notifications')
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
              console.warn('⚠️ notifications table is missing. Falling back to local JSON for notifications.');
            } else {
              console.error('Supabase query error retrieving notifications:', error.message);
            }
          } else if (data) {
            return data as NotificationRecord[];
          }
        } catch (err) {
          console.error('Exception and Supabase fallback in getAll notifications:', err);
        }
      }
    }

    // Fallback to local file
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(NOTIFICATIONS_FILE_PATH, 'utf-8');
      const allNotifs = JSON.parse(raw) as NotificationRecord[];
      // Simple sort descending by created_at
      const sorted = allNotifs.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      
      if (businessId) {
        return sorted.filter(n => n.business_id === businessId);
      }
      return sorted;
    } catch (err) {
      console.error('Error reading notifications file:', err);
      return [];
    }
  }

  static async create(notif: Omit<NotificationRecord, 'id' | 'created_at' | 'status'>): Promise<NotificationRecord> {
    const isLocal = !(isSupabaseConfigured && !isSchemaMissing);
    const freshRecord: NotificationRecord = {
      id: isLocal ? `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` : (undefined as any),
      ...notif,
      status: 'unread',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .insert({
              business_id: notif.business_id || null,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              priority: notif.priority || 'medium',
              metadata: notif.metadata || {}
            })
            .select('*')
            .single();

          if (error) {
            console.error('Supabase error creating notification, using fallback:', error.message);
          } else if (data) {
            return data as NotificationRecord;
          }
        } catch (err) {
          console.error('Exception in DB create notification:', err);
        }
      }
    }

    // fallback write
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(NOTIFICATIONS_FILE_PATH, 'utf-8');
      const allNotifs = JSON.parse(raw) as NotificationRecord[];
      allNotifs.push(freshRecord);
      await fs.writeFile(NOTIFICATIONS_FILE_PATH, JSON.stringify(allNotifs, null, 2), 'utf-8');
      return freshRecord;
    } catch (err) {
      console.error('Error writing notifications local:', err);
      return freshRecord;
    }
  }

  static async markAsRead(id: string): Promise<NotificationRecord | null> {
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .update({ status: 'read', read_at: nowIso })
            .eq('id', id)
            .select('*')
            .single();

          if (!error && data) {
            return data as NotificationRecord;
          }
          console.error('Supabase error marking notification read:', error?.message);
        } catch (err) {
          console.error('Exception in DB markAsRead:', err);
        }
      }
    }

    // Fallback mark read
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(NOTIFICATIONS_FILE_PATH, 'utf-8');
      const allNotifs = JSON.parse(raw) as NotificationRecord[];
      let found: NotificationRecord | null = null;
      const updated = allNotifs.map(n => {
        if (n.id === id) {
          found = { ...n, status: 'read', read_at: nowIso };
          return found;
        }
        return n;
      });
      await fs.writeFile(NOTIFICATIONS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
      return found;
    } catch (err) {
      console.error('Error marking read local:', err);
      return null;
    }
  }

  static async markAllAsRead(businessId?: string | null): Promise<boolean> {
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase
            .from('notifications')
            .update({ status: 'read', read_at: nowIso })
            .eq('status', 'unread');

          if (businessId) {
            query = query.eq('business_id', businessId);
          }

          const { error } = await query;
          if (!error) return true;
          console.error('Supabase error marking all read:', error.message);
        } catch (err) {
          console.error('Exception in DB markAllAsRead:', err);
        }
      }
    }

    // Fallback write
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(NOTIFICATIONS_FILE_PATH, 'utf-8');
      const allNotifs = JSON.parse(raw) as NotificationRecord[];
      const updated = allNotifs.map(n => {
        if (n.status === 'unread' && (!businessId || n.business_id === businessId)) {
          return { ...n, status: 'unread' as const, read_at: nowIso }; // Corrected status to preserve literal type if needed, mark read
        }
        return n;
      }).map(n => {
        // Actually make sure they are read
        if (!businessId || n.business_id === businessId) {
          return { ...n, status: 'read' as const, read_at: nowIso };
        }
        return n;
      });
      await fs.writeFile(NOTIFICATIONS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error marking all read local:', err);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

          if (!error) return true;
          console.error('Supabase error deleting notification:', error.message);
        } catch (err) {
          console.error('Exception in DB delete notification:', err);
        }
      }
    }

    // Fallback file delete
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(NOTIFICATIONS_FILE_PATH, 'utf-8');
      const allNotifs = JSON.parse(raw) as NotificationRecord[];
      const filtered = allNotifs.filter(n => n.id !== id);
      await fs.writeFile(NOTIFICATIONS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error deleting local notification:', err);
      return false;
    }
  }
}
