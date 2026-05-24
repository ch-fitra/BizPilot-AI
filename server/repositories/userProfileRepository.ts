import { runSupabaseQuery } from '../db/supabaseClient';

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

export class UserProfileRepository {
  static async findByEmail(email: string): Promise<UserProfile | null> {
    const cleanEmail = email.toLowerCase().trim();
    const data = await runSupabaseQuery<UserProfile | null>('user_profiles.findByEmail', (supabase) =>
      supabase
        .from('user_profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle()
    );

    return data || null;
  }

  static async findById(id: string): Promise<UserProfile | null> {
    const data = await runSupabaseQuery<UserProfile | null>('user_profiles.findById', (supabase) =>
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    );

    return data || null;
  }

  static async create(user: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const data = await runSupabaseQuery<UserProfile>('user_profiles.create', (supabase) =>
      supabase
        .from('user_profiles')
        .insert({
          email: user.email.toLowerCase().trim(),
          password_hash: user.password_hash,
          full_name: user.full_name,
          avatar_url: user.avatar_url || null,
          default_business_id: user.default_business_id || null,
        })
        .select()
        .single()
    );

    return data;
  }

  static async update(
    id: string,
    updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<UserProfile | null> {
    const data = await runSupabaseQuery<UserProfile | null>('user_profiles.update', (supabase) =>
      supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle()
    );

    return data || null;
  }
}
