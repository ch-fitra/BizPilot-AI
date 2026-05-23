import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'staff' | 'viewer';
  created_at?: string;
  updated_at?: string;
  
  // Joined virtual properties
  user_email?: string;
  user_name?: string;
}

const MEMBERS_FILE_PATH = path.join(process.cwd(), 'business_members.json');

export class BusinessMemberRepository {
  private static async ensureLocalFileExists(): Promise<void> {
    try {
      await fs.access(MEMBERS_FILE_PATH);
    } catch {
      // Create empty initial array
      await fs.writeFile(MEMBERS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  static async getMembersByBusinessId(businessId: string): Promise<BusinessMember[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('business_members')
            .select(`
              *,
              user_profiles:user_id (
                email,
                full_name
              )
            `)
            .eq('business_id', businessId);

          if (error) {
            console.error('Supabase error fetching business members:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          } else if (data) {
            return (data as any[]).map(row => ({
              id: row.id,
              business_id: row.business_id,
              user_id: row.user_id,
              role: row.role as any,
              created_at: row.created_at,
              updated_at: row.updated_at,
              user_email: row.user_profiles?.email || 'unknown@domain.com',
              user_name: row.user_profiles?.full_name || 'Unknown User'
            }));
          }
        } catch (err) {
          console.error('Unhandled DB Exception in getMembersByBusinessId:', err);
        }
      }
    }

    // JSON Local Fallback
    try {
      await this.ensureLocalFileExists();
      const content = await fs.readFile(MEMBERS_FILE_PATH, 'utf-8');
      const memberships = JSON.parse(content) as BusinessMember[];
      const filtered = memberships.filter(m => m.business_id === businessId);

      // Join with local users for details
      const usersContent = await fs.readFile(path.join(process.cwd(), 'user_profiles.json'), 'utf-8');
      const users = JSON.parse(usersContent) as any[];

      return filtered.map(m => {
        const u = users.find(usr => usr.id === m.user_id);
        return {
          ...m,
          user_email: u ? u.email : 'demo@bizpilot.ai',
          user_name: u ? u.full_name : 'Staff Demo'
        };
      });
    } catch {
      return [];
    }
  }

  static async getMembershipsByUserId(userId: string): Promise<BusinessMember[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
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
            .eq('user_id', userId);

          if (error) {
            console.error('Supabase error query user memberships:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          } else if (data) {
            return (data as any[]).map(row => ({
              id: row.id,
              business_id: row.business_id,
              user_id: row.user_id,
              role: row.role,
              created_at: row.created_at,
              updated_at: row.updated_at,
              // Inject virtual business detail if needed
              user_name: row.business_profiles?.business_name || 'Business Workspace'
            }));
          }
        } catch (err) {
          console.error('Unhandled DB Exception in getMembershipsByUserId:', err);
        }
      }
    }

    // JSON Local Fallback
    try {
      await this.ensureLocalFileExists();
      const content = await fs.readFile(MEMBERS_FILE_PATH, 'utf-8');
      const memberships = JSON.parse(content) as BusinessMember[];
      return memberships.filter(m => m.user_id === userId);
    } catch {
      return [];
    }
  }

  static async getMembership(businessId: string, userId: string): Promise<BusinessMember | null> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('business_members')
            .select('*')
            .eq('business_id', businessId)
            .eq('user_id', userId)
            .maybeSingle();

          if (error) {
            console.error('Supabase error fetching single membership:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          } else if (data) {
            return data as BusinessMember;
          }
        } catch (err) {
          console.error('Unhandled DB Exception in getMembership:', err);
        }
      }
    }

    // Fallback JSON
    try {
      await this.ensureLocalFileExists();
      const content = await fs.readFile(MEMBERS_FILE_PATH, 'utf-8');
      const list = JSON.parse(content) as BusinessMember[];
      const match = list.find(m => m.business_id === businessId && m.user_id === userId);
      return match || null;
    } catch {
      return null;
    }
  }

  static async addMember(businessId: string, userId: string, role: 'owner' | 'admin' | 'staff' | 'viewer' = 'staff'): Promise<BusinessMember> {
    const freshId = `bm_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    const freshMember: BusinessMember = {
      id: freshId,
      business_id: businessId,
      user_id: userId,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('business_members')
            .insert({
              business_id: businessId,
              user_id: userId,
              role
            })
            .select()
            .single();

          if (!error && data) {
            return data as BusinessMember;
          } else if (error) {
            console.error('Supabase error adding member:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          }
        } catch (err) {
          console.error('DatabaseException in addMember:', err);
        }
      }
    }

    // Fallback JSON
    await this.ensureLocalFileExists();
    const content = await fs.readFile(MEMBERS_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as BusinessMember[];
    
    // De-duplicate if exists
    const filtered = list.filter(m => !(m.business_id === businessId && m.user_id === userId));
    filtered.push(freshMember);
    await fs.writeFile(MEMBERS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');

    return freshMember;
  }

  static async updateMemberRole(businessId: string, userId: string, role: 'owner' | 'admin' | 'staff' | 'viewer'): Promise<BusinessMember | null> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('business_members')
            .update({
              role,
              updated_at: new Date().toISOString()
            })
            .eq('business_id', businessId)
            .eq('user_id', userId)
            .select()
            .single();

          if (!error && data) {
            return data as BusinessMember;
          } else if (error) {
            console.error('Supabase error changing membership role:', error.message);
            if (error.message.includes('Could not find') || error.message.includes('relation "')) {
              setSchemaMissing(true);
            }
          }
        } catch (err) {
          console.error('DatabaseException in updateMemberRole:', err);
        }
      }
    }

    // Fallback JSON
    await this.ensureLocalFileExists();
    const content = await fs.readFile(MEMBERS_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as BusinessMember[];
    const idx = list.findIndex(m => m.business_id === businessId && m.user_id === userId);

    if (idx === -1) return null;

    list[idx].role = role;
    list[idx].updated_at = new Date().toISOString();
    await fs.writeFile(MEMBERS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return list[idx];
  }

  static async removeMember(businessId: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('business_members')
            .delete()
            .eq('business_id', businessId)
            .eq('user_id', userId);

          if (!error) return true;
          
          console.error('Supabase error deleting membership:', error.message);
          if (error.message.includes('Could not find') || error.message.includes('relation "')) {
            setSchemaMissing(true);
          }
        } catch (err) {
          console.error('Unhandled Database deletion error:', err);
        }
      }
    }

    // Local JSON
    await this.ensureLocalFileExists();
    const content = await fs.readFile(MEMBERS_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as BusinessMember[];
    const filtered = list.filter(m => !(m.business_id === businessId && m.user_id === userId));

    if (filtered.length === list.length) return false;

    await fs.writeFile(MEMBERS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
}
