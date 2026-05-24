import crypto from 'crypto';
import { runSupabaseQuery } from '../db/supabaseClient';
import { WarungModeService } from './warungModeService';
import { PassiveIntelligenceService } from './passiveIntelligenceService';
import { WhatsAppProviderClient, IncomingWhatsAppMessage } from './whatsappProviderService';

function sanitizeText(v: unknown, max = 1000): string {
  return String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function hashPhone(phone: string): string {
  const normalized = phone.replace(/[^\d]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
function last4(phone: string): string {
  const p = phone.replace(/[^\d]/g, '');
  return p.slice(-4);
}

type Intent = 'receipt_image' | 'text_transaction' | 'daily_summary' | 'active_alerts' | 'help' | 'unknown';
function detectIntent(msg: IncomingWhatsAppMessage): Intent {
  if (msg.messageType === 'image') return 'receipt_image';
  const t = sanitizeText(msg.text || '').toLowerCase();
  if (/(ringkasan|summary).*(hari ini|hari)/.test(t)) return 'daily_summary';
  if (/(alert|peringatan).*(bisnis|saya)?/.test(t)) return 'active_alerts';
  if (/(jual|laku|pengeluaran|beli|tambah)/.test(t)) return 'text_transaction';
  if (/(bantuan|help|menu)/.test(t)) return 'help';
  return 'unknown';
}

export class WhatsAppAssistantService {
  static async cleanupExpiredPendingActions(): Promise<number> {
    const now = new Date().toISOString();
    const rows = await runSupabaseQuery<any[]>('wa.pending.expired.list', (supabase) =>
      supabase.from('whatsapp_pending_actions').select('id').eq('status', 'pending').lte('expires_at', now)
    );
    let count = 0;
    for (const row of rows || []) {
      await runSupabaseQuery<any>('wa.pending.expired.update', (supabase) =>
        supabase.from('whatsapp_pending_actions').update({ status: 'expired' }).eq('id', row.id).select('id').single()
      );
      count += 1;
    }
    return count;
  }
  static async linkPhoneToBusiness(businessId: string, phoneNumber: string) {
    const h = hashPhone(phoneNumber);
    return runSupabaseQuery<any>('wa.link.upsert', (supabase) =>
      supabase.from('whatsapp_business_links').upsert({
        business_id: businessId,
        phone_number_hash: h,
        phone_last4: last4(phoneNumber),
        verified_at: new Date().toISOString(),
        status: 'active',
      }, { onConflict: 'business_id,phone_number_hash' }).select('*').single()
    );
  }

  static async handleIncoming(msg: IncomingWhatsAppMessage): Promise<void> {
    const phoneHash = hashPhone(msg.from);
    const existing = await runSupabaseQuery<any | null>('wa.logs.dedupe', (supabase) =>
      supabase.from('whatsapp_logs').select('id').eq('provider_message_id', msg.providerMessageId).maybeSingle()
    );
    if (existing?.id) return;

    const link = await runSupabaseQuery<any | null>('wa.link.find', (supabase) =>
      supabase.from('whatsapp_business_links').select('*').eq('phone_number_hash', phoneHash).eq('status', 'active').maybeSingle()
    );
    const businessId = link?.business_id || null;

    await runSupabaseQuery<any>('wa.logs.inbound', (supabase) =>
      supabase.from('whatsapp_logs').insert({
        business_id: businessId,
        recipient: 'assistant',
        phone_number_hash: phoneHash,
        direction: 'inbound',
        message_type: msg.messageType,
        message: sanitizeText(msg.text || msg.mediaUrl || '', 500),
        message_text: sanitizeText(msg.text || '', 1000),
        status: 'sent',
        provider: WhatsAppProviderClient.getProvider(),
        provider_message_id: msg.providerMessageId,
      }).select('id').single()
    );

    if (!businessId) {
      await this.reply(msg.from, null, 'Nomor Anda belum terhubung ke bisnis. Hubungi admin untuk aktivasi WhatsApp Assistant.');
      return;
    }

    const pending = await runSupabaseQuery<any | null>('wa.pending.find', (supabase) =>
      supabase.from('whatsapp_pending_actions').select('*').eq('business_id', businessId).eq('phone_number_hash', phoneHash).eq('status', 'pending').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle()
    );

    const text = sanitizeText(msg.text || '', 1000).toLowerCase();
    if (pending && (text === 'ya' || text === 'batal' || text === 'edit')) {
      if (text === 'ya') {
        const payload = pending.payload || {};
        await WarungModeService.saveTransaction({
          businessId,
          transcript: String(payload.transcript || ''),
          items: Array.isArray(payload.items) ? payload.items : [],
          validationStatus: payload.status === 'ok' ? 'ok' : 'partial',
        });
        await runSupabaseQuery<any>('wa.pending.done', (supabase) =>
          supabase.from('whatsapp_pending_actions').update({ status: 'confirmed' }).eq('id', pending.id).select('id').single()
        );
        await this.reply(msg.from, businessId, 'Transaksi berhasil disimpan.');
      } else if (text === 'batal') {
        await runSupabaseQuery<any>('wa.pending.cancel', (supabase) =>
          supabase.from('whatsapp_pending_actions').update({ status: 'cancelled' }).eq('id', pending.id).select('id').single()
        );
        await this.reply(msg.from, businessId, 'Draft dibatalkan.');
      } else {
        await this.reply(msg.from, businessId, 'Silakan kirim ulang transaksi dengan format baru.');
      }
      return;
    }

    const intent = detectIntent(msg);
    if (intent === 'text_transaction') {
      const parsed = await WarungModeService.parseVoiceTranscript(businessId, msg.text || '');
      await runSupabaseQuery<any>('wa.pending.create', (supabase) =>
        supabase.from('whatsapp_pending_actions').insert({
          business_id: businessId,
          phone_number_hash: phoneHash,
          action_type: 'text_transaction',
          payload: parsed,
          status: 'pending',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }).select('id').single()
      );
      const summary = parsed.items.map((i) => `${i.qty ?? '?'} ${i.name}`).join(', ');
      await this.reply(msg.from, businessId, `Saya membaca: ${summary}. Balas YA untuk simpan atau EDIT untuk ubah, BATAL untuk batalkan.`);
      return;
    }

    if (intent === 'daily_summary') {
      const alerts = await PassiveIntelligenceService.getActiveAlerts(businessId);
      await this.reply(msg.from, businessId, `Ringkasan hari ini: alert aktif ${alerts.length}. Gunakan dashboard untuk detail lengkap.`);
      return;
    }
    if (intent === 'active_alerts') {
      const alerts = await PassiveIntelligenceService.getActiveAlerts(businessId);
      const msgText = alerts.slice(0, 3).map((a) => `- ${a.title}`).join('\n') || 'Tidak ada alert aktif.';
      await this.reply(msg.from, businessId, msgText);
      return;
    }

    await this.reply(msg.from, businessId, 'Perintah tersedia: kirim transaksi teks, "ringkasan hari ini", "alert bisnis saya".');
  }

  private static async reply(to: string, businessId: string | null, message: string) {
    const send = await WhatsAppProviderClient.sendText(to, sanitizeText(message, 1000));
    await runSupabaseQuery<any>('wa.logs.outbound', (supabase) =>
      supabase.from('whatsapp_logs').insert({
        business_id: businessId,
        recipient: to,
        phone_number_hash: hashPhone(to),
        direction: 'outbound',
        message_type: 'text',
        message: sanitizeText(message, 1000),
        message_text: sanitizeText(message, 1000),
        status: send.status,
        provider: WhatsAppProviderClient.getProvider(),
        provider_message_id: send.providerMessageId || null,
      }).select('id').single()
    );
  }
}
