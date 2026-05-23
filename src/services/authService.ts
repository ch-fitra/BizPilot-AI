export interface Workspace {
  id: string;
  business_name: string;
  business_type?: string;
  owner_name?: string;
  location?: string;
  currency?: string;
  email?: string;
  description?: string;
  role?: 'owner' | 'admin' | 'staff' | 'viewer';
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  defaultBusinessId?: string | null;
}

export interface AuthSessionResponse {
  success: boolean;
  token?: string;
  user?: User;
  currentWorkspace?: Workspace | null;
  workspaces?: Workspace[];
  error?: string;
}

export interface TeamMember {
  id: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'staff' | 'viewer';
  user_email: string;
  user_name: string;
}

export class AuthService {
  static getLocalToken(): string | null {
    return localStorage.getItem('bizpilot_token');
  }

  static getLocalActiveBusinessId(): string | null {
    return localStorage.getItem('bizpilot_active_business_id');
  }

  static setSession(token: string, businessId: string) {
    localStorage.setItem('bizpilot_token', token);
    localStorage.setItem('bizpilot_active_business_id', businessId);
  }

  static clearSession() {
    localStorage.removeItem('bizpilot_token');
    localStorage.removeItem('bizpilot_active_business_id');
  }

  static async register(payload: any): Promise<AuthSessionResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Pendaftaran gagal.' };
    }
  }

  static async login(payload: any): Promise<AuthSessionResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Login gagal.' };
    }
  }

  static async me(): Promise<AuthSessionResponse> {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.getLocalToken()}`
        }
      });
      if (!response.ok) {
        throw new Error('Sesi kedaluwarsa');
      }
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memuat profil.' };
    }
  }

  static async createWorkspace(payload: { businessName: string; businessType?: string; location?: string; currency?: string }): Promise<{ success: boolean; workspace?: Workspace; error?: string }> {
    try {
      const response = await fetch('/api/auth/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getLocalToken()}`
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal membuat workspace.' };
    }
  }

  static async updateProfile(payload: { fullName?: string; avatarUrl?: string; defaultBusinessId?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getLocalToken()}`
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memperbarui profil.' };
    }
  }

  // --- TEAM OPERATIONS ---
  static async getTeamMembers(): Promise<{ success: boolean; members?: TeamMember[]; error?: string }> {
    try {
      const response = await fetch('/api/team', {
        headers: {
          'Authorization': `Bearer ${this.getLocalToken()}`,
          'x-business-id': this.getLocalActiveBusinessId() || ''
        }
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memuat tim.' };
    }
  }

  static async inviteMember(payload: { email: string; fullName: string; role: string }): Promise<{ success: boolean; member?: TeamMember; error?: string; message?: string }> {
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getLocalToken()}`,
          'x-business-id': this.getLocalActiveBusinessId() || ''
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mengundang anggota.' };
    }
  }

  static async updateMemberRole(userId: string, role: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch('/api/team/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getLocalToken()}`,
          'x-business-id': this.getLocalActiveBusinessId() || ''
        },
        body: JSON.stringify({ userId, role })
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memutakhirkan peran anggota.' };
    }
  }

  static async removeMember(userId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch(`/api/team/member/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getLocalToken()}`,
          'x-business-id': this.getLocalActiveBusinessId() || ''
        }
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghapus anggota dari tim.' };
    }
  }
}
