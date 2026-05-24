import { BusinessProfile, StorageMode } from '../types/analysis';

export interface BusinessProfileResponse {
  success: boolean;
  storageMode: StorageMode;
  isSupabaseConfigured: boolean;
  isSchemaMissing?: boolean;
  data: BusinessProfile | null;
}

export class BusinessProfileService {
  static async getActiveProfile(): Promise<BusinessProfileResponse> {
    try {
      const response = await fetch('/api/business-profile');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Failed to fetch active business profile:', err);
      return {
        success: false,
        storageMode: 'Unavailable',
        isSupabaseConfigured: false,
        isSchemaMissing: false,
        data: null
      };
    }
  }

  static async recheckSchema(): Promise<BusinessProfileResponse> {
    try {
      const response = await fetch('/api/business-profile/recheck-schema', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to trigger database schema recheck:', error);
      return {
        success: false,
        storageMode: 'Unavailable',
        isSupabaseConfigured: false,
        isSchemaMissing: true,
        data: null
      };
    }
  }

  static async getCombinedSchema(): Promise<{ success: boolean; sql: string }> {
    try {
      const response = await fetch('/api/business-profile/combined-schema');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to retrieve combined SQL DDL schema:', error);
      return { success: false, sql: '' };
    }
  }

  static async createProfile(profile: Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    try {
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to create business profile:', error);
      throw error;
    }
  }

  static async updateProfile(id: string, profile: Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<any> {
    try {
      const response = await fetch(`/api/business-profile/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to update business profile ${id}:`, error);
      throw error;
    }
  }

  static async deleteProfile(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/business-profile/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error(`Failed to delete profile ${id}:`, error);
      throw error;
    }
  }
}
