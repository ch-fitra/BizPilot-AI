import { Router, Request, Response } from 'express';
import { persistOCRScan, processStrictOCR } from '../services/ocrExtractionService';

const router = Router();

router.post('/nota', async (req: Request, res: Response) => {
  try {
    const { imageData, mimeType, fileName } = req.body;
    const businessId = (req as any).businessId as string | undefined;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Konteks bisnis/workspace tidak terdeteksi.',
      });
    }

    if (!imageData || !mimeType || typeof imageData !== 'string' || typeof mimeType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'imageData (base64) dan mimeType wajib dikirim.',
      });
    }

    const extractionResult = await processStrictOCR({
      imageData,
      mimeType,
      businessId,
      fileName,
    });

    const savedScan = await persistOCRScan({
      businessId,
      result: extractionResult,
    });

    const unreadable = extractionResult.extraction.status === 'unreadable';
    const userMessage = unreadable
      ? 'Nota tidak terbaca jelas. Silakan foto ulang.'
      : 'Data berhasil dibaca, mohon cek kembali sebelum disimpan.';

    return res.json({
      success: true,
      data: extractionResult.extraction,
      fileName: fileName || 'nota.jpg',
      validation_status: extractionResult.validationStatus,
      critical_invalid: extractionResult.criticalInvalid,
      duplicate_scan_id: extractionResult.duplicateScanId,
      scan_id: savedScan?.id || null,
      message: userMessage,
    });
  } catch (error: any) {
    console.error('[OCR Nota] Extraction failed:', error);

    if (error?.code === 'DUPLICATE_RECEIPT') {
      return res.status(409).json({
        success: false,
        code: error.code,
        duplicate_scan_id: error.duplicateScanId || null,
        error: error.message,
      });
    }

    return res.status(error?.status || 500).json({
      success: false,
      code: error?.code,
      error: error?.message || 'Gagal memproses struk. Pastikan gambar jelas dan cukup terang.',
    });
  }
});

export default router;
