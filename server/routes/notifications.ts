import express from 'express';
import { NotificationRepository } from '../repositories/notificationRepository';
import { AutomationRepository } from '../repositories/automationRepository';
import { WhatsAppLogRepository } from '../repositories/whatsappLogRepository';
import { AutomationEngine } from '../services/automationEngine';
import { WhatsAppProviderService } from '../services/whatsappProvider';
import { AIMessageGenerator } from '../services/aiMessageGenerator';
import { enforceRole } from '../middleware/roleGuard';

const router = express.Router();

// ==========================================
// 1. NOTIFICATION ENDPOINTS
// ==========================================

// GET /api/notifications -> Retrieve all notifications for a business
router.get('/notifications', async (req, res) => {
  try {
    const businessId = (req.query.business_id as string) || null;
    
    // Automatically trigger on-demand sweep & daily summary to keep everything freshly live!
    await AutomationEngine.runSweep(businessId);
    await AutomationEngine.generateDailySummary(businessId);

    const list = await NotificationRepository.getAll(businessId);
    res.json({ success: true, notifications: list });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications -> Manually trigger notification creation or run live sweep
router.post('/notifications', enforceRole('edit'), async (req, res) => {
  try {
    const { business_id, type, title, message, priority, metadata } = req.body;
    
    if (!type || !title || !message) {
      // If we called simple empty POST, trigger a sweep check
      const businessId = business_id || null;
      const { triggeredCount } = await AutomationEngine.runSweep(businessId);
      await AutomationEngine.generateDailySummary(businessId);
      const list = await NotificationRepository.getAll(businessId);
      return res.json({ 
        success: true, 
        message: `Sweep completed on-demand. Triggered ${triggeredCount} alarms.`, 
        notifications: list 
      });
    }

    const created = await NotificationRepository.create({
      business_id: business_id || null,
      type,
      title,
      message,
      priority: priority || 'medium',
      metadata: metadata || {}
    });

    res.json({ success: true, notification: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/read-all -> Mark all as read
router.post('/notifications/read-all', async (req, res) => {
  try {
    const businessId = (req.body.business_id as string) || null;
    await NotificationRepository.markAllAsRead(businessId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/:id/read -> Mark a specific notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = (req.query.business_id as string) || (req as any).businessId || null;
    const existing = (await NotificationRepository.getAll(businessId)).find((notification) => notification.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    const updated = await NotificationRepository.markAsRead(id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, notification: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/notifications/:id -> Delete a specific notification
router.delete('/notifications/:id', enforceRole('delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = (req.query.business_id as string) || (req as any).businessId || null;
    const existing = (await NotificationRepository.getAll(businessId)).find((notification) => notification.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Notification not found or delete failed' });
    }
    const success = await NotificationRepository.delete(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Notification not found or delete failed' });
    }
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. AUTOMATION RULES ENDPOINTS
// ==========================================

// GET /api/automation/rules -> Fetch all automation rules
router.get('/automation/rules', async (req, res) => {
  try {
    const businessId = (req.query.business_id as string) || null;
    const rules = await AutomationRepository.getAll(businessId);
    res.json({ success: true, rules });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/automation/rules -> Add a new rule
router.post('/automation/rules', enforceRole('edit'), async (req, res) => {
  try {
    const { business_id, rule_type, is_active, trigger_config, action_config } = req.body;
    
    if (!rule_type) {
      return res.status(400).json({ success: false, error: 'rule_type is required' });
    }

    const created = await AutomationRepository.create({
      business_id: business_id || null,
      rule_type,
      is_active: is_active ?? true,
      trigger_config: trigger_config || {},
      action_config: action_config || {}
    });

    res.json({ success: true, rule: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/automation/rules/:id -> Edit an existing rule
router.put('/automation/rules/:id', enforceRole('edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rule_type, is_active, trigger_config, action_config } = req.body;

    const updated = await AutomationRepository.update(id, {
      rule_type,
      is_active,
      trigger_config,
      action_config
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Automation rule not found' });
    }

    res.json({ success: true, rule: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/automation/rules/:id -> Delete a rule
router.delete('/automation/rules/:id', enforceRole('delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await AutomationRepository.delete(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }
    res.json({ success: true, message: 'Automation rule deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. WHATSAPP & AI GENERATOR ENDPOINTS
// ==========================================

// POST /api/whatsapp/send -> Enqueue/Dispatch WhatsApp message
router.post('/whatsapp/send', enforceRole('edit'), async (req, res) => {
  try {
    const { recipient, message, business_id } = req.body;

    if (!recipient || !message) {
      return res.status(400).json({ success: false, error: 'recipient and message are required' });
    }

    const dispatchResult = await WhatsAppProviderService.sendMessage({
      recipient,
      message,
      business_id: business_id || null
    });

    res.json(dispatchResult);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/whatsapp/logs -> Get history of all dispatched WhatsApp logs
router.get('/whatsapp/logs', async (req, res) => {
  try {
    const businessId = (req.query.business_id as string) || null;
    const logs = await WhatsAppLogRepository.getAll(businessId);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/whatsapp/generate-message -> Hook into AI Message Generator
router.post('/whatsapp/generate-message', async (req, res) => {
  try {
    const { type, tone, customerName, businessName, itemName, amount, extraDetails } = req.body;

    if (!customerName || !businessName) {
      return res.status(400).json({ success: false, error: 'customerName and businessName are required' });
    }

    const output = await AIMessageGenerator.generateMessage({
      type: type || 'follow_up',
      tone: tone || 'friendly',
      customerName,
      businessName,
      itemName,
      amount,
      extraDetails
    });

    res.json({ success: true, message: output });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/crm/dashboard -> Endpoint needed by OverviewTab.tsx in Phase 6 changes, let's map it cleanly here in case!
router.get('/crm/dashboard', async (req, res) => {
  try {
    const businessId = (req.query.business_id as string) || null;
    const leads = await NotificationRepository.getAll(businessId); // dummy/real
    
    // Simple mock summaries for instant load
    res.json({
      success: true,
      stats: {
        totalLeads: 12,
        hotLeads: 3,
        pendingFollowup: 2,
        closedDeals: 4,
        totalEstimatedRevenue: 24500000
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
