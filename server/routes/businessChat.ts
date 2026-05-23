import { Router } from 'express';
import { validateAndSanitizeInput } from '../utils/promptGuards';
import { BusinessChatService } from '../services/businessChatService';
import { ChatHistoryRepository } from '../repositories/chatHistoryRepository';

const router = Router();

// 1. POST /api/chat/business
router.post('/business', async (req, res) => {
  try {
    // Audit input bounds and sanitize malicious entries
    const validated = validateAndSanitizeInput(req.body);
    const includeHistory = req.body.include_history !== false;

    // Call service to coordinate profile context query and ask Gemini
    const result = await BusinessChatService.processChat({
      message: validated.message,
      business_id: validated.business_id,
      analysis_id: validated.analysis_id,
      include_history: includeHistory
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('Error handling business chat API route:', err.message || err);
    res.status(err.message?.includes('required') || err.message?.includes('too long') ? 400 : 500).json({
      success: false,
      error: err.message || 'Gagal memproses AI Chat.'
    });
  }
});

// 2. GET /api/chat/history
router.get('/history', async (req, res) => {
  try {
    const businessId = (req.query.business_id as string) || null;
    const history = await ChatHistoryRepository.getAll(businessId);

    res.json({
      success: true,
      data: history
    });
  } catch (err: any) {
    console.error('Error retrieving chat histories:', err.message || err);
    res.status(500).json({
      success: false,
      error: err.message || 'Gagal mengambil riwayat chat.'
    });
  }
});

// 3. DELETE /api/chat/history
router.delete('/history', async (req, res) => {
  try {
    const businessId = (req.query.business_id as string) || null;
    await ChatHistoryRepository.clearHistory(businessId);

    res.json({
      success: true,
      message: 'Riwayat percakapan bisnis telah dibersihkan secara permanen.'
    });
  } catch (err: any) {
    console.error('Error clearing chat histories:', err.message || err);
    res.status(500).json({
      success: false,
      error: err.message || 'Gagal menghapus riwayat chat.'
    });
  }
});

export default router;
