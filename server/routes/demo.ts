import { Router } from 'express';
import { DemoSeeder } from '../demo/demoSeeder';
import { demoScenarios } from '../demo/demoScenarios';

const router = Router();

// GET /api/demo/scenarios -> List available demo scenarios
router.get('/scenarios', (req, res) => {
  const scenariosList = Object.keys(demoScenarios).map((key) => {
    const sc = demoScenarios[key];
    return {
      id: sc.id,
      title: sc.title,
      business_type: sc.business.business_type,
      description: sc.business.description
    };
  });

  res.json({
    success: true,
    data: scenariosList
  });
});

// POST /api/demo/start -> Start a demo scenario
router.post('/start', async (req, res, next) => {
  try {
    const { scenarioId } = req.body;
    
    if (!scenarioId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Parameter scenarioId wajib dikirimkan.'
        }
      });
    }

    // Always use the verified tenant context from authMiddleware.
    const activeBusinessId = (req as any).businessId || 'local_profile_id';

    const success = await DemoSeeder.seedScenario(scenarioId, activeBusinessId);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SCENARIO_NOT_FOUND',
          message: `Skenario "${scenarioId}" tidak ditemukan atau gagal diproses.`
        }
      });
    }

    res.json({
      success: true,
      message: `Berhasil menyemai data demo skenario "${scenarioId}" untuk workspace aktif (${activeBusinessId}).`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/demo/reset -> Reset demo state
router.post('/reset', async (req, res, next) => {
  try {
    const activeBusinessId = (req as any).businessId || 'local_profile_id';
    await DemoSeeder.resetDemo(activeBusinessId);

    res.json({
      success: true,
      message: `Pristine reset berhasil. Workspace aktif (${activeBusinessId}) dikembalikan ke template awal.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
