import axios from 'axios';
import crypto from 'crypto';

export type WhatsAppProviderType = 'simulation' | 'fonnte' | 'meta';

export interface IncomingWhatsAppMessage {
  providerMessageId: string;
  from: string;
  messageType: 'text' | 'image' | 'audio' | 'unknown';
  text?: string;
  mediaUrl?: string;
}

export class WhatsAppProviderClient {
  static getProvider(): WhatsAppProviderType {
    const p = String(process.env.WHATSAPP_PROVIDER || 'simulation').toLowerCase();
    if (p === 'fonnte' || p === 'meta') return p;
    return 'simulation';
  }

  static verifyWebhook(query: any): boolean {
    const token = String(process.env.WHATSAPP_VERIFY_TOKEN || '');
    if (!token) return false;
    const mode = String(query['hub.mode'] || '');
    const verifyToken = String(query['hub.verify_token'] || '');
    return mode === 'subscribe' && verifyToken === token;
  }

  static verifySignature(headers: any, rawBody: string): boolean {
    const secret = String(process.env.WHATSAPP_WEBHOOK_SECRET || '');
    if (!secret) return this.getProvider() === 'simulation';
    if (this.getProvider() === 'meta') {
      const received = String(headers['x-hub-signature-256'] || '');
      if (!received.startsWith('sha256=')) return false;
      const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
      return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
    }
    const received = String(headers['x-whatsapp-signature'] || headers['x-fonnte-signature'] || '');
    return received.length > 0 && received === secret;
  }

  static normalizeInbound(body: any): IncomingWhatsAppMessage[] {
    const provider = this.getProvider();
    if (provider === 'fonnte') {
      return [{
        providerMessageId: String(body?.id || body?.messageId || `${Date.now()}`),
        from: String(body?.sender || body?.from || ''),
        messageType: body?.url ? 'image' : 'text',
        text: body?.message || '',
        mediaUrl: body?.url || undefined,
      }];
    }

    if (provider === 'meta') {
      const entries = body?.entry || [];
      const out: IncomingWhatsAppMessage[] = [];
      for (const e of entries) {
        for (const change of e?.changes || []) {
          for (const msg of change?.value?.messages || []) {
            out.push({
              providerMessageId: String(msg?.id || `${Date.now()}`),
              from: String(msg?.from || ''),
              messageType: msg?.type === 'image' ? 'image' : msg?.type === 'audio' ? 'audio' : 'text',
              text: msg?.text?.body || '',
              mediaUrl: msg?.image?.id || msg?.audio?.id,
            });
          }
        }
      }
      return out;
    }

    return [{
      providerMessageId: String(body?.id || `${Date.now()}`),
      from: String(body?.from || body?.sender || ''),
      messageType: body?.mediaUrl ? 'image' : 'text',
      text: body?.text || body?.message || '',
      mediaUrl: body?.mediaUrl || undefined,
    }];
  }

  static async sendText(to: string, message: string): Promise<{ status: 'sent' | 'failed'; providerMessageId?: string }> {
    const provider = this.getProvider();
    if (provider === 'simulation') return { status: 'sent', providerMessageId: `sim_${Date.now()}` };
    try {
      if (provider === 'fonnte') {
        const url = String(process.env.WHATSAPP_API_URL || '');
        const token = String(process.env.WHATSAPP_API_TOKEN || '');
        const res = await axios.post(url, { target: to, message }, { headers: { Authorization: token }, timeout: 8000 });
        return { status: res.status >= 200 && res.status < 300 ? 'sent' : 'failed', providerMessageId: String(res.data?.id || '') };
      }
      const url = String(process.env.WHATSAPP_API_URL || '').replace('{{PHONE_NUMBER_ID}}', String(process.env.WHATSAPP_PHONE_NUMBER_ID || ''));
      const token = String(process.env.WHATSAPP_API_TOKEN || '');
      const res = await axios.post(url, { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } }, { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 });
      return { status: res.status >= 200 && res.status < 300 ? 'sent' : 'failed', providerMessageId: String(res.data?.messages?.[0]?.id || '') };
    } catch {
      return { status: 'failed' };
    }
  }
}
