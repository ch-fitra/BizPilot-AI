import { runSupabaseQuery } from '../db/supabaseClient';

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'staff' | 'viewer';
  created_at?: string;
  updated_at?: string;
  user_email?: string;
  user_name?: string;
}

export class BusinessMemberRepository {
  static async getMembersByBusinessId(businessId: string): Promise<BusinessMember[]> {
    const data = await runSupabaseQuery<any[]>('business_members.getMembersByBusinessId', (supabase) =>
      supabase
        .from('business_members')
        .select(`
          *,
          user_profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('business_id', businessId)
    );

    return (data || []).map((row) => ({
      id: row.id,
      business_id: row.business_id,
      user_id: row.user_id,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_email: row.user_profiles?.email || 'unknown@domain.com',
      user_name: row.user_profiles?.full_name || 'Unknown User',
    }));
  }

  static async getMembershipsByUserId(userId: string): Promise<BusinessMember[]> {
    const data = await runSupabaseQuery<any[]>('business_members.getMembershipsByUserId', (supabase) =>
      supabase
        .from('business_members')
        .select(`
          *,
          business_profiles:business_id (
            business_name,
            business_type,
            location,
            currency
          )
        `)
        .eq('user_id', userId)
    );

    return (data || []).map((row) => ({
      id: row.id,
      business_id: row.business_id,
      user_id: row.user_id,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.business_profiles?.business_name || 'Business Workspace',
    }));
  }

  static async getMembership(businessId: string, userId: string): Promise<BusinessMember | null> {
    const data = await runSupabaseQuery<BusinessMember | null>('business_members.getMembership', (supabase) =>
      supabase
        .from('business_members')
        .select('*')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .maybeSingle()
    );

    return data || null;
  }

  static async addMember(
    businessId: string,
    userId: string,
    role: 'owner' | 'admin' | 'staff' | 'viewer' = 'staff'
  ): Promise<BusinessMember> {
    const data = await runSupabaseQuery<BusinessMember>('business_members.addMember', (supabase) =>
      supabase
        .from('business_members')
        .upsert({
          business_id: businessId,
          user_id: userId,
          role,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'business_id,user_id' })
        .select()
        .single()
    );

    return data;
  }

  static async updateMemberRole(
    businessId: string,
    userId: string,
    role: 'owner' | 'admin' | 'staff' | 'viewer'
  ): Promise<BusinessMember | null> {
    const data = await runSupabaseQuery<BusinessMember | null>('business_members.updateMemberRole', (supabase) =>
      supabase
        .from('business_members')
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .select()
        .maybeSingle()
    );

    return data || null;
  }

  static async removeMember(businessId: string, userId: string): Promise<boolean> {
    await runSupabaseQuery<null>('business_members.removeMember', (supabase) =>
      supabase
        .from('business_members')
        .delete()
        .eq('business_id', businessId)
        .eq('user_id', userId)
    );

    return true;
  }
}
