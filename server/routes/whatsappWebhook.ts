import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { WhatsAppProviderClient } from '../services/whatsappProviderService';
import { WhatsAppAssistantService } from '../services/whatsappAssistantService';
import { simpleAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();
const limiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });

router.get('/whatsapp/webhook', (req, res) => {
  if (WhatsAppProviderClient.verifyWebhook(req.query)) {
    return res.status(200).send(String(req.query['hub.challenge'] || 'ok'));
  }
  return res.status(403).send('forbidden');
});

router.post('/whatsapp/webhook', limiter, async (req, res) => {
  try {
    if (!WhatsAppProviderClient.verifySignature(req.headers, JSON.stringify(req.body || {}))) {
      return res.status(403).json({ success: false, error: 'Webhook signature invalid.' });
    }
    const messages = WhatsAppProviderClient.normalizeInbound(req.body);
    for (const m of messages) {
      await WhatsAppAssistantService.handleIncoming(m);
    }
    return res.json({ success: true, processed: messages.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Webhook processing failed.' });
  }
});

router.get('/whatsapp/link-status', simpleAuthMiddleware, async (req, res) => {
  try {
    return res.json({
      success: true,
      provider: process.env.WHATSAPP_PROVIDER || 'simulation',
      linked_phone_last4: null,
      business_id: null,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to get status.' });
  }
});

export default router;
