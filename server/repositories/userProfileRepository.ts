import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url?: string | null;
  default_business_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

const USERS_FILE_PATH = path.join(process.cwd(), 'user_profiles.json');

export class UserProfileRepository {
  private static async ensureLocalFileExists(): Promise<void> {
    try {
      await fs.access(USERS_FILE_PATH);
    } catch {
      // Create empty initial array
      await fs.writeFile(USERS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  static async findByEmail(email: string): Promise<UserProfile | null> {
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (error) {
            console.error('Supabase error finding user by email:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          } else if (data) {
            return data as UserProfile;
          }
        } catch (err) {
          console.error('Unhandled database error in findByEmail:', err);
        }
      }
    }

    // Fallback JSON
    try {
      await this.ensureLocalFileExists();
      const content = await fs.readFile(USERS_FILE_PATH, 'utf-8');
      const list = JSON.parse(content) as UserProfile[];
      const user = list.find(item => item.email.toLowerCase().trim() === cleanEmail);
      return user || null;
    } catch (err) {
      console.error('Failed to read local user profiles:', err);
      return null;
    }
  }

  static async findById(id: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (error) {
            console.error('Supabase error finding user by ID:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          } else if (data) {
            return data as UserProfile;
          }
        } catch (err) {
          console.error('Unhandled database error in findById:', err);
        }
      }
    }

    // Fallback JSON
    try {
      await this.ensureLocalFileExists();
      const content = await fs.readFile(USERS_FILE_PATH, 'utf-8');
      const list = JSON.parse(content) as UserProfile[];
      const user = list.find(item => item.id === id);
      return user || null;
    } catch (err) {
      console.error('Failed to read local user profiles by ID:', err);
      return null;
    }
  }

  static async create(user: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const id = `usr_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const newUser: UserProfile = {
      ...user,
      id,
      email: user.email.toLowerCase().trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .insert({
              email: newUser.email,
              password_hash: newUser.password_hash,
              full_name: newUser.full_name,
              avatar_url: newUser.avatar_url || null,
              default_business_id: newUser.default_business_id || null,
            })
            .select()
            .single();

          if (!error && data) {
            return data as UserProfile;
          } else if (error) {
            console.error('Supabase error creating user profile:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          }
        } catch (err) {
          console.error('Database insertion exception in createUser:', err);
        }
      }
    }

    // Fallback JSON
    await this.ensureLocalFileExists();
    const content = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as UserProfile[];
    list.push(newUser);
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return newUser;
  }

  static async update(id: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<UserProfile | null> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

          if (!error && data) {
            return data as UserProfile;
          } else if (error) {
            console.error('Supabase error updating user profile:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          }
        } catch (err) {
          console.error('Database update exception in updateUser:', err);
        }
      }
    }

    // JSON local storage fallback
    await this.ensureLocalFileExists();
    const content = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as UserProfile[];
    const index = list.findIndex(item => item.id === id);

    if (index === -1) {
      return null;
    }

    const updatedUser = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    list[index] = updatedUser;
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return updatedUser;
  }
}
