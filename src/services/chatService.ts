import { ChatBusinessResponse, ChatHistoryResponse } from '../types/chat';

export class ChatService {
  /**
   * Submit a new chat prompt message based on active/selected context
   */
  static async sendMessage(params: {
    message: string;
    business_id?: string | null;
    analysis_id?: string | null;
    include_history?: boolean;
  }): Promise<ChatBusinessResponse> {
    try {
      const response = await fetch('/api/chat/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error: any) {
      console.error('ChatService failed to send message:', error);
      return {
        success: false,
        reply: `Aduh! Terjadi kesalahan koneksi konsultan: ${error.message || error}`,
        sources: { hasProfile: false, hasAnalysis: false, analysisDate: null, analysisId: null },
        suggested_next_questions: [],
        created_at: new Date().toISOString(),
        error: error.message || String(error)
      };
    }
  }

  /**
   * Load historical session chat messages
   */
  static async getHistory(businessId?: string | null): Promise<ChatHistoryResponse> {
    try {
      let url = '/api/chat/history';
      if (businessId) {
        url += `?business_id=${encodeURIComponent(businessId)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error: any) {
      console.error('ChatService failed to pull history:', error);
      return {
        success: false,
        data: [],
        error: error.message || String(error)
      };
    }
  }

  /**
   * Erase historical message records associated with a business (or all)
   */
  static async clearHistory(businessId?: string | null): Promise<boolean> {
    try {
      let url = '/api/chat/history';
      if (businessId) {
        url += `?business_id=${encodeURIComponent(businessId)}`;
      }

      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return !!data.success;
    } catch (error: any) {
      console.error('ChatService failed to purge history:', error);
      return false;
    }
  }
}
