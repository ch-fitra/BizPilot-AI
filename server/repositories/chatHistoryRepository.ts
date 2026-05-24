import { runSupabaseQuery } from '../db/supabaseClient';

export interface ChatMessageRecord {
  id: string;
  business_id?: string | null;
  analysis_id?: string | null;
  role: 'user' | 'assistant';
  content: string;
  context_snapshot?: any | null;
  created_at: string;
}

export class ChatHistoryRepository {
  static async getAll(businessId?: string | null): Promise<ChatMessageRecord[]> {
    const data = await runSupabaseQuery<ChatMessageRecord[]>('business_chat_messages.getAll', (supabase) => {
      let query = supabase
        .from('business_chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      return query;
    });

    return data || [];
  }

  static async addMessage(message: Omit<ChatMessageRecord, 'id' | 'created_at'>): Promise<ChatMessageRecord> {
    const data = await runSupabaseQuery<ChatMessageRecord>('business_chat_messages.addMessage', (supabase) =>
      supabase
        .from('business_chat_messages')
        .insert({
          business_id: message.business_id || null,
          analysis_id: message.analysis_id || null,
          role: message.role,
          content: message.content,
          context_snapshot: message.context_snapshot || null,
        })
        .select('*')
        .single()
    );

    return data;
  }

  static async clearHistory(businessId?: string | null): Promise<boolean> {
    await runSupabaseQuery<null>('business_chat_messages.clearHistory', (supabase) => {
      let query = supabase.from('business_chat_messages').delete();

      if (businessId) {
        query = query.eq('business_id', businessId);
      } else {
        query = query.filter('id', 'not.is', null);
      }

      return query;
    });

    return true;
  }
}
