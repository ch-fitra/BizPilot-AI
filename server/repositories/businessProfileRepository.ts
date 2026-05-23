import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured, isSchemaMissing, setSchemaMissing } from '../db/supabaseClient';

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

const PROFILE_FILE_PATH = path.join(process.cwd(), 'business_profile.json');

export class BusinessProfileRepository {
  private static async ensureLocalFileExists(): Promise<void> {
    try {
      await fs.access(PROFILE_FILE_PATH);
    } catch {
      // Default initial profile representation as fallback
      const defaultProfile: BusinessProfile[] = [
        {
          id: 'local_profile_id',
          business_name: 'Kopi Selaras Cilandak',
          business_type: 'F&B Cafe',
          owner_name: 'Budi Santoso',
          location: 'Cilandak, Jakarta Selatan',
          currency: 'IDR',
          phone: '+62 812-3456-7890',
          email: 'kontak@kopiselaras.com',
          description: 'Kedai kopi artisan lokal dengan nuansa asri, menyajikan biji kopi Nusantara berkualitas tinggi untuk penikmat kopi urban.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      await fs.writeFile(PROFILE_FILE_PATH, JSON.stringify(defaultProfile, null, 2), 'utf-8');
    }
  }

  // Gets the currently active business profile (usually the first/newest or a designated default)
  static async getActiveProfile(): Promise<BusinessProfile | null> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('business_profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            const isMissingTable = error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
              console.warn('⚠️ business_profiles table is missing. Temporarily skipping Supabase integration to run on Local JSON.');
            } else {
              console.error('Supabase query error retrieving business profile:', error.message);
            }
            // Fall back to local if error occurs
          } else if (data) {
            return data as BusinessProfile;
          }
        } catch (err: any) {
          console.error('Unhandled database error: falling back to local storage profile:', err);
        }
      }
    }

    // Fallback: Read local file profile
    try {
      await this.ensureLocalFileExists();
      const content = await fs.readFile(PROFILE_FILE_PATH, 'utf-8');
      const list = JSON.parse(content) as BusinessProfile[];
      return list.length > 0 ? list[0] : null;
    } catch (err) {
      console.error('Failed to read local business profile:', err);
      return null;
    }
  }

  // Retrieves all profiles
  static async getAllProfiles(): Promise<BusinessProfile[]> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('business_profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            const isMissingTable = error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist');
            if (isMissingTable) {
              setSchemaMissing(true);
            } else {
              console.error('Supabase query error listing profiles:', error.message);
            }
          } else if (data) {
            return data as BusinessProfile[];
          }
        } catch (err) {
          console.error('Database fetching failed:', err);
        }
      }
    }

    try {
      await this.ensureLocalFileExists();
      const content = await fs.readFile(PROFILE_FILE_PATH, 'utf-8');
      return JSON.parse(content) as BusinessProfile[];
    } catch {
      return [];
    }
  }

  // Create an initial or secondary business profile
  static async createProfile(profile: Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BusinessProfile> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
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
            .single();

          if (!error && data) {
            return data as BusinessProfile;
          } else if (error) {
            console.error('Error in profile insertion:', error.message);
            if (error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist')) {
              setSchemaMissing(true);
            }
          }
        } catch (err) {
          console.error('Exception creating business profile on Supabase:', err);
        }
      }
    }

    // Local profile fallback creation
    await this.ensureLocalFileExists();
    const content = await fs.readFile(PROFILE_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as BusinessProfile[];

    const newProfile: BusinessProfile = {
      ...profile,
      id: `bp_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
      currency: profile.currency || 'IDR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    list.push(newProfile);
    await fs.writeFile(PROFILE_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return newProfile;
  }

  // Update business profile
  static async updateProfile(id: string, updates: Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<BusinessProfile | null> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('business_profiles')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

          if (!error && data) {
            return data as BusinessProfile;
          } else if (error) {
            console.error('Error updating business profile in DB:', error.message);
            if (error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist')) {
              setSchemaMissing(true);
            }
          }
        } catch (err) {
          console.error('Exception updating business profile on DB:', err);
        }
      }
    }

    // Local JSON update
    await this.ensureLocalFileExists();
    const content = await fs.readFile(PROFILE_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as BusinessProfile[];
    const index = list.findIndex(item => item.id === id);

    if (index === -1) {
      return null;
    }

    const updatedProfile = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    list[index] = updatedProfile;
    await fs.writeFile(PROFILE_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return updatedProfile;
  }

  // Delete business profile
  static async deleteProfile(id: string): Promise<boolean> {
    if (isSupabaseConfigured && !isSchemaMissing) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('business_profiles')
            .delete()
            .eq('id', id);

          if (!error) {
            return true;
          } else {
            console.error('Error deleting profile:', error.message);
            if (error.message.includes('Could not find the table') || error.message.includes('relation "') || error.message.includes('does not exist')) {
              setSchemaMissing(true);
            }
          }
        } catch (err) {
          console.error('Exception purging database profile record:', err);
        }
      }
    }

    // JSON local storage fallback
    await this.ensureLocalFileExists();
    const content = await fs.readFile(PROFILE_FILE_PATH, 'utf-8');
    const list = JSON.parse(content) as BusinessProfile[];
    const filtered = list.filter(item => item.id !== id);

    if (filtered.length === list.length) {
      return false;
    }

    await fs.writeFile(PROFILE_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
}
