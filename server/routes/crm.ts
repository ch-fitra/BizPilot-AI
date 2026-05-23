import { Router } from 'express';
import { CRMLeadRepository, CRMLead } from '../repositories/crmLeadRepository';
import { enforceRole } from '../middleware/roleGuard';

const router = Router();

// Helper to sanitize lead inputs
function sanitizeLeadBody(body: any): Omit<CRMLead, 'id' | 'lead_score' | 'created_at' | 'updated_at'> {
  if (!body.lead_name || typeof body.lead_name !== 'string' || !body.lead_name.trim()) {
    throw new Error('Nama Lead (lead_name) wajib diisi.');
  }

  const email = body.email ? String(body.email).trim() : null;
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Format email tidak valid.');
    }
  }

  const estimated_value = Number(body.estimated_value);
  if (isNaN(estimated_value) || estimated_value < 0) {
    throw new Error('Nilai Estimasi (estimated_value) tidak boleh negatif.');
  }

  const allowedStages = ['New Lead', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'];
  const stage = body.pipeline_stage || 'New Lead';
  if (!allowedStages.includes(stage)) {
    throw new Error(`Pipeline Stage tidak valid. Harus salah satu dari: ${allowedStages.join(', ')}`);
  }

  const allowedInterest = ['Cold', 'Warm', 'Hot'];
  const interest = body.interest_level || 'Warm';
  if (!allowedInterest.includes(interest)) {
    throw new Error(`Interest Level tidak valid. Harus salah satu dari: ${allowedInterest.join(', ')}`);
  }

  return {
    business_id: body.business_id || null,
    lead_name: body.lead_name.trim().replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, ''),
    company_name: body.company_name ? String(body.company_name).trim() : null,
    phone: body.phone ? String(body.phone).trim() : null,
    email,
    source: body.source ? String(body.source).trim() : null,
    notes: body.notes ? String(body.notes).trim() : null,
    pipeline_stage: stage as any,
    estimated_value,
    interest_level: interest as any,
    tags: Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()) : [],
    next_follow_up: body.next_follow_up ? new Date(body.next_follow_up).toISOString() : null,
    status: 'active'
  };
}

// 1. GET /api/crm/dashboard (Retrieves summarized statistics for high efficiency overview)
router.get('/dashboard', async (req, res) => {
  try {
    const businessId = (req.query.business_id as string) || null;
    const leads = await CRMLeadRepository.getAll(businessId);
    
    const now = new Date();
    
    let totalEstimatedRevenue = 0;
    let hotLeadsCount = 0;
    let pendingFollowupCount = 0;
    let closedWonCount = 0;
    let closedLostCount = 0;
    let upcomingFollowupCount = 0;
    
    leads.forEach(l => {
      // Estimated Value for everything except lost deals
      if (l.pipeline_stage !== 'Lost') {
        totalEstimatedRevenue += Number(l.estimated_value || 0);
      }

      if (l.interest_level === 'Hot' && l.pipeline_stage !== 'Lost' && l.pipeline_stage !== 'Won') {
        hotLeadsCount++;
      }

      if (l.pipeline_stage === 'Won') {
        closedWonCount++;
      } else if (l.pipeline_stage === 'Lost') {
        closedLostCount++;
      } else {
        // active stages
        pendingFollowupCount++;
      }

      if (l.next_follow_up) {
        upcomingFollowupCount++;
      }
    });

    const totalDeals = closedWonCount + closedLostCount;
    const conversionRate = totalDeals > 0 ? Math.round((closedWonCount / totalDeals) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalLeads: leads.length,
        hotLeads: hotLeadsCount,
        pendingFollowup: pendingFollowupCount,
        closedDeals: closedWonCount,
        totalEstimatedRevenue,
        conversionRate,
        upcomingFollowup: upcomingFollowupCount
      }
    });
  } catch (err: any) {
    console.error('Error compiled CRM analytics overview route:', err.message);
    res.status(500).json({ success: false, error: 'Gagal mengompilasi statistik CRM.' });
  }
});

// 2. GET /api/crm/leads
router.get('/leads', async (req, res) => {
  try {
    const businessId = (req.query.business_id as string) || null;
    const data = await CRMLeadRepository.getAll(businessId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Gagal memuat list prospek.' });
  }
});

// 3. GET /api/crm/leads/:id
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await CRMLeadRepository.getById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Prospek Lead tidak ditemukan.' });
    }
    const activeBusinessId = (req as any).businessId;
    if (activeBusinessId && lead.business_id !== activeBusinessId) {
      return res.status(403).json({ success: false, error: 'Lead belongs to another workspace.' });
    }
    const activities = await CRMLeadRepository.getActivitiesByLeadId(req.params.id);
    res.json({ success: true, data: lead, activities });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/crm/leads
router.post('/leads', enforceRole('edit'), async (req, res) => {
  try {
    const sanitized = sanitizeLeadBody(req.body);
    const result = await CRMLeadRepository.createLead(sanitized);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.message.includes('wajib') || err.message.includes('valid') || err.message.includes('negatif') ? 400 : 500).json({
      success: false,
      error: err.message
    });
  }
});

// 5. PUT /api/crm/leads/:id
router.put('/leads/:id', enforceRole('edit'), async (req, res) => {
  try {
    const existing = await CRMLeadRepository.getById(req.params.id);
    const activeBusinessId = (req as any).businessId;
    if (activeBusinessId && existing && existing.business_id !== activeBusinessId) {
      return res.status(403).json({ success: false, error: 'Lead belongs to another workspace.' });
    }
    const sanitized = sanitizeLeadBody(req.body);
    const result = await CRMLeadRepository.updateLead(req.params.id, sanitized);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Prospek Lead tidak ditemukan untuk diedit.' });
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.message.includes('wajib') || err.message.includes('valid') || err.message.includes('negatif') ? 400 : 500).json({
      success: false,
      error: err.message
    });
  }
});

// 6. DELETE /api/crm/leads/:id
router.delete('/leads/:id', enforceRole('delete'), async (req, res) => {
  try {
    const existing = await CRMLeadRepository.getById(req.params.id);
    const activeBusinessId = (req as any).businessId;
    if (activeBusinessId && existing && existing.business_id !== activeBusinessId) {
      return res.status(403).json({ success: false, error: 'Lead belongs to another workspace.' });
    }
    const success = await CRMLeadRepository.deleteLead(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Prospek Lead tidak ditemukan atau gagal dihapus.' });
    }
    res.json({ success: true, message: 'Prospek Lead berhasil dihapus secara permanen.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/crm/leads/:id/activities
router.get('/leads/:id/activities', async (req, res) => {
  try {
    const lead = await CRMLeadRepository.getById(req.params.id);
    const activeBusinessId = (req as any).businessId;
    if (activeBusinessId && lead && lead.business_id !== activeBusinessId) {
      return res.status(403).json({ success: false, error: 'Lead belongs to another workspace.' });
    }
    const activities = await CRMLeadRepository.getActivitiesByLeadId(req.params.id);
    res.json({ success: true, data: activities });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/crm/leads/:id/activities
router.post('/leads/:id/activities', enforceRole('edit'), async (req, res) => {
  try {
    const lead = await CRMLeadRepository.getById(req.params.id);
    const activeBusinessId = (req as any).businessId;
    if (activeBusinessId && lead && lead.business_id !== activeBusinessId) {
      return res.status(403).json({ success: false, error: 'Lead belongs to another workspace.' });
    }
    const { activity_type, notes } = req.body;
    if (!notes || !notes.trim()) {
      return res.status(400).json({ success: false, error: 'Notes aktivitas wajib diisi.' });
    }
    const result = await CRMLeadRepository.addActivity(
      req.params.id,
      activity_type || 'note',
      String(notes).trim()
    );
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
