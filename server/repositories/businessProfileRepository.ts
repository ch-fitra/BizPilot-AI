import { runSupabaseQuery } from '../db/supabaseClient';

export interface BusinessProfile {
  id: string;
  business_name: string;
  business_type?: string;
  owner_name?: string;
  location?: string;
  currency?: string;
  phone?: string;
  email?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export class BusinessProfileRepository {
  static async getActiveProfile(): Promise<BusinessProfile | null> {
    const data = await runSupabaseQuery<BusinessProfile | null>('business_profiles.getActiveProfile', (supabase) =>
      supabase
        .from('business_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    );

    return data || null;
  }

  static async getAllProfiles(): Promise<BusinessProfile[]> {
    const data = await runSupabaseQuery<BusinessProfile[]>('business_profiles.getAllProfiles', (supabase) =>
      supabase
        .from('business_profiles')
        .select('*')
        .order('created_at', { ascending: false })
    );

    return data || [];
  }

  static async getProfilesByIds(ids: string[]): Promise<BusinessProfile[]> {
    if (ids.length === 0) return [];

    const data = await runSupabaseQuery<BusinessProfile[]>('business_profiles.getProfilesByIds', (supabase) =>
      supabase
        .from('business_profiles')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false })
    );

    return data || [];
  }

  static async getById(id: string): Promise<BusinessProfile | null> {
    const data = await runSupabaseQuery<BusinessProfile | null>('business_profiles.getById', (supabase) =>
      supabase
        .from('business_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    );

    return data || null;
  }

  static async createProfile(profile: Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BusinessProfile> {
    const data = await runSupabaseQuery<BusinessProfile>('business_profiles.createProfile', (supabase) =>
      supabase
        .from('business_profiles')
        .insert({
          business_name: profile.business_name,
          business_type: profile.business_type || null,
          owner_name: profile.owner_name || null,
          location: profile.location || null,
          currency: profile.currency || 'IDR',
          phone: profile.phone || null,
          email: profile.email || null,
          description: profile.description || null,
        })
        .select()
        .single()
    );

    return data;
  }

  static async updateProfile(
    id: string,
    updates: Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<BusinessProfile | null> {
    const data = await runSupabaseQuery<BusinessProfile | null>('business_profiles.updateProfile', (supabase) =>
      supabase
        .from('business_profiles')
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

  static async deleteProfile(id: string): Promise<boolean> {
    await runSupabaseQuery<null>('business_profiles.deleteProfile', (supabase) =>
      supabase
        .from('business_profiles')
        .delete()
        .eq('id', id)
    );

    return true;
  }
}
