import { Router } from 'express';
import { AnalysisHistoryRepository, AnalysisHistoryRecord } from '../repositories/analysisHistoryRepository';

const router = Router();

// GET all analysis records
router.get('/', async (req, res) => {
  try {
    const activeBusinessId = (req as any).businessId;
    const list = await AnalysisHistoryRepository.getAll(activeBusinessId);
    res.json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: 'Failed to retrieve analysis history list: ' + error.message });
  }
});

// GET latest analysis record
router.get('/latest', async (req, res) => {
  try {
    const activeBusinessId = (req as any).businessId;
    const latest = await AnalysisHistoryRepository.getLatest(activeBusinessId);
    res.json({ success: true, data: latest });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: 'Failed to fetch latest analysis: ' + error.message });
  }
});

// GET analysis record by ID
router.get('/:id', async (req, res) => {
  try {
    const activeBusinessId = (req as any).businessId;
    const record = await AnalysisHistoryRepository.getById(req.params.id, activeBusinessId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Analysis record not found' });
    }
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: 'Failed to retrieve analysis record details: ' + error.message });
  }
});

// POST to save a new analysis record
router.post('/', async (req, res) => {
  try {
    const {
      business_name,
      business_type,
      input_source,
      uploaded_file_name,
      raw_input_summary,
      ai_result,
      health_score,
      total_sales,
      total_transactions,
      top_products,
      inventory_alerts,
      customer_sentiment,
      customer_reviews_summary,
      action_plan
    } = req.body;

    // Minimum required elements to compute or record
    if (!ai_result) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: ai_result' 
      });
    }

    const created = await AnalysisHistoryRepository.create({
      business_id: (req as any).businessId || null,
      business_name: business_name || 'My Business',
      business_type: business_type || 'MSME',
      input_source: input_source || 'text',
      uploaded_file_name: uploaded_file_name || undefined,
      raw_input_summary: raw_input_summary || 'Manual Analysis Input',
      ai_result,
      health_score: typeof health_score === 'number' ? health_score : (ai_result.health_score || 0),
      total_sales: typeof total_sales === 'number' ? total_sales : 0,
      total_transactions: typeof total_transactions === 'number' ? total_transactions : 0,
      top_products: top_products || ai_result.top_products || [],
      inventory_alerts: inventory_alerts || ai_result.alerts || [],
      customer_sentiment: customer_sentiment || 'neutral',
      customer_reviews_summary: customer_reviews_summary || ai_result.customer_reviews_summary || [],
      action_plan: action_plan || ai_result.action_plan || []
    });

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: 'Failed to preserve new analysis report in repository: ' + error.message });
  }
});

// DELETE analysis record
router.delete('/:id', async (req, res) => {
  try {
    const activeBusinessId = (req as any).businessId;
    const record = await AnalysisHistoryRepository.getById(req.params.id, activeBusinessId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Analysis record not found for execution' });
    }
    const deleted = await AnalysisHistoryRepository.delete(req.params.id, activeBusinessId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Analysis record not found for execution' });
    }
    res.json({ success: true, message: 'Analysis history successfully purged from storage.' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: 'Failed to delete analysis history item: ' + error.message });
  }
});

export default router;
