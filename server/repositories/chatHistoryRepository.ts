import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

export interface ChatMessageRecord {
  id: string;
  business_id?: string | null;
  analysis_id?: string | null;
  role: 'user' | 'assistant';
  content: string;
  context_snapshot?: any | null;
  created_at: string;
}

const CHAT_FILE_PATH = path.join(process.cwd(), 'chat_history.json');

export class ChatHistoryRepository {
  private static async ensureLocalFileExists(): Promise<void> {
    try {
      await fs.access(CHAT_FILE_PATH);
    } catch {
      await fs.writeFile(CHAT_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  // Retrieve chat history, sorted by created_at ascending
  static async getAll(businessId?: string | null): Promise<ChatMessageRecord[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase
            .from('business_chat_messages')
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
              console.warn('⚠️ business_chat_messages table is missing. Falling back to local JSON for chat.');
            } else {
              console.error('Supabase query error retrieving chat history:', error.message);
            }
          } else if (data) {
            return data as ChatMessageRecord[];
          }
        } catch (err) {
          console.error('Exception in loadChatHistory on DB:', err);
        }
      }
    }

    // Fallback to local JSON
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(CHAT_FILE_PATH, 'utf-8');
      const allMessages = JSON.parse(raw) as ChatMessageRecord[];
      if (businessId) {
        return allMessages.filter(m => m.business_id === businessId);
      }
      return allMessages;
    } catch (err) {
      console.error('Error reading local chat history file:', err);
      return [];
    }
  }

  // Write/append message
  static async addMessage(message: Omit<ChatMessageRecord, 'id' | 'created_at'>): Promise<ChatMessageRecord> {
    const freshRecord: ChatMessageRecord = {
      id: isSupabaseConfigured && !isSchemaMissing ? undefined : `local_msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...message,
      created_at: new Date().toISOString()
    } as any;

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('business_chat_messages')
            .insert({
              business_id: message.business_id || null,
              analysis_id: message.analysis_id || null,
              role: message.role,
              content: message.content,
              context_snapshot: message.context_snapshot || null
            })
            .select('*')
            .single();

          if (error) {
            const isMissingTable = error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
            } else {
              console.error('Error inserting business chat message:', error.message);
            }
          } else if (data) {
            return data as ChatMessageRecord;
          }
        } catch (err) {
          console.error('Exception inserting chat message on DB:', err);
        }
      }
    }

    // Fallback to local JSON
    await this.ensureLocalFileExists();
    try {
      const raw = await fs.readFile(CHAT_FILE_PATH, 'utf-8');
      const allMessages = JSON.parse(raw) as ChatMessageRecord[];
      allMessages.push(freshRecord);
      await fs.writeFile(CHAT_FILE_PATH, JSON.stringify(allMessages, null, 2), 'utf-8');
      return freshRecord;
    } catch (err) {
      console.error('Error writing to local chat history file:', err);
      return freshRecord;
    }
  }

  // Delete chat history
  static async clearHistory(businessId?: string | null): Promise<boolean> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase.from('business_chat_messages').delete();
          if (businessId) {
            query = query.eq('business_id', businessId);
          } else {
            // If no business profile is specified, clear everything or clear where business_id is null
            query = query.filter('id', 'not.is', null);
          }

          const { error } = await query;
          if (error) {
            const isMissingTable = error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
            } else {
              console.error('Error purging business chat messages on Supabase:', error.message);
            }
          } else {
            return true;
          }
        } catch (err) {
          console.error('Exception clearing business chat db table:', err);
        }
      }
    }

    // Fallback to local JSON
    await this.ensureLocalFileExists();
    try {
      if (businessId) {
        const raw = await fs.readFile(CHAT_FILE_PATH, 'utf-8');
        const allMessages = JSON.parse(raw) as ChatMessageRecord[];
        const filtered = allMessages.filter(m => m.business_id !== businessId);
        await fs.writeFile(CHAT_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
      } else {
        await fs.writeFile(CHAT_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
      }
      return true;
    } catch (err) {
      console.error('Error writing cleared state to local chat history file:', err);
      return false;
    }
  }
}
