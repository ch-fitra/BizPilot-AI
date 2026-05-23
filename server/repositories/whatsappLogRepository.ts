import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

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

const WHATSAPP_LOGS_FILE_PATH = path.join(process.cwd(), 'whatsapp_logs.json');

export class WhatsAppLogRepository {
  private static async ensureLocalFileExists(): Promise<void> {
    try {
      await fs.access(WHATSAPP_LOGS_FILE_PATH);
    } catch {
      const demoLogs: WhatsAppLog[] = [
        {
          id: 'wa_log_demo_1',
          business_id: 'local_profile_id',
          recipient: '081298765432',
          message: 'Halo Pak Anto, kami ingin menawarkan paket hemat kopi susu botol 1 Liter untuk event gathering kantor Anda. Apakah ada waktu diskusi besok siang?',
          status: 'sent',
          provider: 'simulation',
          sent_at: new Date(Date.now() - 7200000).toISOString(),
          metadata: { note: 'Mengirim penawaran event' }
        },
        {
          id: 'wa_log_demo_2',
          business_id: 'local_profile_id',
          recipient: '085611223344',
          message: 'Halo Ibu Siti, terima kasih telah menghubungi BizPilot Cafe. Kami ingin mengkonfirmasi ketertarikan Anda terkait paket Reseller Biji Kopi Gayo.',
          status: 'sent',
          provider: 'simulation',
          sent_at: new Date(Date.now() - 864 * 36000).toISOString(),
          metadata: { note: 'Follow up lead hari kemarin' }
        }
      ];
      await fs.writeFile(WHATSAPP_LOGS_FILE_PATH, JSON.stringify(demoLogs, null, 2), 'utf-8');
    }
  }

  static async getAll(businessId?: string | null): Promise<WhatsAppLog[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase
            .from('whatsapp_logs')
            .select('*')
            .order('sent_at', { ascending: false });

          if (businessId) {
            query = query.eq('business_id', businessId);
          }

          const { data, error } = await query;
          if (error) {
            const isMissingTable = error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
              console.warn('⚠️ whatsapp_logs table is missing. Falling back to local JSON for whatsapp logs.');
            } else {
              console.error('Supabase query error retrieving whatsapp logs:', error.message);
            }
          } else if (data) {
            return data as WhatsAppLog[];
          }
        } catch (err) {
          console.error('Exception and Supabase fallback in getAll whatsapp logs:', err);
        }
      }
    }

    // Fallback file reading
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(WHATSAPP_LOGS_FILE_PATH, 'utf-8');
      const allLogs = JSON.parse(raw) as WhatsAppLog[];
      const sorted = allLogs.sort((a, b) => new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime());
      
      if (businessId) {
        return sorted.filter(l => l.business_id === businessId || !l.business_id || l.business_id === 'local_profile_id');
      }
      return sorted;
    } catch (err) {
      console.error('Error reading local whatsapp logs file:', err);
      return [];
    }
  }

  static async create(log: Omit<WhatsAppLog, 'id' | 'sent_at'>): Promise<WhatsAppLog> {
    const isLocal = !(isSupabaseConfigured && !isSchemaMissing);
    const freshRecord: WhatsAppLog = {
      id: isLocal ? `wa_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` : (undefined as any),
      ...log,
      sent_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('whatsapp_logs')
            .insert({
              business_id: log.business_id || null,
              recipient: log.recipient,
              message: log.message,
              status: log.status,
              provider: log.provider,
              metadata: log.metadata || {}
            })
            .select('*')
            .single();

          if (error) {
            console.error('Supabase error creating whatsapp log, using fallback:', error.message);
          } else if (data) {
            return data as WhatsAppLog;
          }
        } catch (err) {
          console.error('Exception in DB create whatsapp log:', err);
        }
      }
    }

    // fallback save local
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(WHATSAPP_LOGS_FILE_PATH, 'utf-8');
      const allLogs = JSON.parse(raw) as WhatsAppLog[];
      allLogs.push(freshRecord);
      await fs.writeFile(WHATSAPP_LOGS_FILE_PATH, JSON.stringify(allLogs, null, 2), 'utf-8');
      return freshRecord;
    } catch (err) {
      console.error('Error writing local whatsapp log:', err);
      return freshRecord;
    }
  }
}
