import axios from 'axios';
import { WhatsAppLogRepository, WhatsAppLog } from '../repositories/whatsappLogRepository';

export interface SendWhatsAppResponse {
  success: boolean;
  message: string;
  provider: 'simulation' | 'fonnte' | 'whatsapp_cloud_api';
  status: 'sent' | 'failed';
}

export class WhatsAppProviderService {
  /**
   * Universal provider logic that checks environment configuration and delegates
   * to actual WhatsApp API or falls back to standard simulation logging.
   */
  static async sendMessage(params: {
    recipient: string;
    message: string;
    business_id?: string | null;
  }): Promise<SendWhatsAppResponse> {
    const { recipient, message, business_id } = params;
    
    // Clean recipient phone format
    const cleanPhone = this.sanitizePhoneNumber(recipient);
    
    // Read environments
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Detect if live provider is configured
    let provider: 'simulation' | 'fonnte' | 'whatsapp_cloud_api' = 'simulation';
    let status: 'sent' | 'failed' = 'sent';
    let description = 'Message sent in Simulation Mode';

    if (apiUrl && apiToken) {
      // Determine if Cloud API or Fonnte
      if (apiUrl.includes('graph.facebook.com') || phoneNumberId) {
        provider = 'whatsapp_cloud_api';
        try {
          // Trigger mock/real request to WhatsApp Cloud API
          const realUrl = apiUrl.replace('{{PHONE_NUMBER_ID}}', phoneNumberId || '');
          const res = await axios.post(realUrl, {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: message }
          }, {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });
          
          if (res.status === 200 || res.status === 201) {
            status = 'sent';
            description = 'Successfully push to WhatsApp Cloud API';
          } else {
            status = 'failed';
            description = `Cloud API returned status ${res.status}`;
          }
        } catch (err: any) {
          status = 'failed';
          description = `Cloud API Error: ${err.message}`;
          console.error('WhatsApp Cloud API dispatch error:', err);
        }
      } else {
        // Assume Fonnte device integrations
        provider = 'fonnte';
        try {
          const res = await axios.post(apiUrl, {
            target: cleanPhone,
            message: message
          }, {
            headers: {
              'Authorization': apiToken
            },
            timeout: 5000
          });

          if (res.data && (res.data.status === true || res.data.message?.includes('sukses') || res.data.status === 'success')) {
            status = 'sent';
            description = 'Successfully push to Fonnte Device Gateway';
          } else {
            status = 'failed';
            description = `Fonnte Gateway error: ${JSON.stringify(res.data)}`;
          }
        } catch (err: any) {
          status = 'failed';
          description = `Fonnte Dispatch Error: ${err.message}`;
          console.error('Fonnte API dispatch error:', err);
        }
      }
    } else {
      // Simulation mode
      provider = 'simulation';
      status = 'sent';
      description = 'Simulation Mode Active: Pesan berhasil disimpan ke WhatsApp logs simulator.';
    }

    // Always log to history
    if (!business_id) {
      throw new Error('Workspace bisnis aktif wajib tersedia sebelum mengirim atau mencatat WhatsApp.');
    }

    await WhatsAppLogRepository.create({
      business_id,
      recipient: cleanPhone,
      message: message,
      status: status,
      provider: provider,
      metadata: { debug_log: description }
    });

    return {
      success: status === 'sent',
      message: description,
      provider,
      status
    };
  }

  /**
   * Normalize standard telephone numbers to international format or clean numeric string
   */
  private static sanitizePhoneNumber(phone: string): string {
    let clean = phone.replace(/[^0-9+]/g, '');
    // Standardize Indonesia default format: e.g. 08123... -> 628123...
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    // Stripe potential '+' prefixes if we only need raw digits
    clean = clean.replace('+', '');
    return clean;
  }
}
