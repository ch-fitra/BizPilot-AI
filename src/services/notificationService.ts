import { NotificationRecord, WhatsAppLog } from '../types/notification';
import { AutomationRule } from '../types/automation';

export class NotificationService {
  // ==========================================
  // 1. NOTIFICATIONS API
  // ==========================================
  
  static async getNotifications(businessId?: string | null): Promise<NotificationRecord[]> {
    const url = businessId ? `/api/notifications?business_id=${encodeURIComponent(businessId)}` : '/api/notifications';
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal mengambil notifikasi');
    }
    return data.notifications || [];
  }

  static async triggerSweep(businessId?: string | null): Promise<NotificationRecord[]> {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal menjalankan sweep audit');
    }
    return data.notifications || [];
  }

  static async markAsRead(id: string): Promise<NotificationRecord> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal menandai dibaca');
    }
    return data.notification;
  }

  static async markAllAsRead(businessId?: string | null): Promise<void> {
    const res = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal menandai dibaca semua');
    }
  }

  static async deleteNotification(id: string): Promise<void> {
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal menghapus notifikasi');
    }
  }

  // ==========================================
  // 2. AUTOMATION RULES API
  // ==========================================

  static async getAutomationRules(businessId?: string | null): Promise<AutomationRule[]> {
    const url = businessId ? `/api/automation/rules?business_id=${encodeURIComponent(businessId)}` : '/api/automation/rules';
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal mengambil aturan otomatisasi');
    }
    return data.rules || [];
  }

  static async createAutomationRule(rule: Omit<AutomationRule, 'id'>): Promise<AutomationRule> {
    const res = await fetch('/api/automation/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal membuat aturan otomatisasi');
    }
    return data.rule;
  }

  static async updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const res = await fetch(`/api/automation/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal memperbarui aturan otomatisasi');
    }
    return data.rule;
  }

  static async deleteAutomationRule(id: string): Promise<void> {
    const res = await fetch(`/api/automation/rules/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal menghapus aturan otomatisasi');
    }
  }

  // ==========================================
  // 3. WHATSAPP & AI GENERATOR API
  // ==========================================

  static async sendWhatsApp(params: {
    recipient: string;
    message: string;
    business_id?: string | null;
  }): Promise<{ success: boolean; message: string; provider: string; status: string }> {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data;
  }

  static async getWhatsAppLogs(businessId?: string | null): Promise<WhatsAppLog[]> {
    const url = businessId ? `/api/whatsapp/logs?business_id=${encodeURIComponent(businessId)}` : '/api/whatsapp/logs';
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal mengambil log WhatsApp');
    }
    return data.logs || [];
  }

  static async generateAIMessage(params: {
    type: string;
    tone: string;
    customerName: string;
    businessName: string;
    itemName?: string;
    amount?: string | number;
    extraDetails?: string;
  }): Promise<string> {
    const res = await fetch('/api/whatsapp/generate-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Gagal merancang draf pesan AI');
    }
    return data.message;
  }
}
