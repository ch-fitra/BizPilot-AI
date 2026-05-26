import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import rateLimit from 'express-rate-limit';
import { getDatabaseHealthSnapshot, verifyDatabaseHealth } from './server/db/supabaseClient';
import { authMiddleware } from './server/middleware/authMiddleware';
import authRouter from './server/routes/authRoutes';
import teamRouter from './server/routes/teamRoutes';
import analysisHistoryRouter from './server/routes/analysisHistory';
import businessProfileRouter from './server/routes/businessProfile';
import reportsRouter from './server/routes/reports';
import businessChatRouter from './server/routes/businessChat';
import crmRouter from './server/routes/crm';
import notificationsRouter from './server/routes/notifications';
import forecastRouter from './server/routes/forecast';
import demoRouter from './server/routes/demo';
import ocrRouter from './server/routes/ocr';
import cashflowRouter from './server/routes/cashflow';
import passiveIntelligenceRouter from './server/routes/passiveIntelligence';
import internalJobsRouter from './server/routes/internalJobs';
import businessMemoryRouter from './server/routes/businessMemory';
import warungModeRouter from './server/routes/warungMode';
import whatsappWebhookRouter from './server/routes/whatsappWebhook';
import founderDashboardRouter from './server/routes/founderDashboard';
import { requestLogger } from './server/middleware/requestLogger';
import { errorHandler, standardizeApiErrorResponse } from './server/middleware/errorHandler';
import { validateEnvironment } from './server/config/envValidation';

dotenv.config();

// Run environmental validation at server boot
const envCheck = validateEnvironment();
console.log('--- [BIZPILOT CO-PILOT STARTUP AUDIT] ---');
if (envCheck.valid) {
  console.log('✅ ALL CRITICAL SECURITY & API CREDENTIALS VERIFIED');
} else {
  console.warn('⚠️ CRITICAL SECRETS DEFICIENT. RUNNING IN LOCAL SIMULATOR RESILIENCY MODE:');
  envCheck.issues.forEach(issue => console.warn(`   - ${issue}`));
}
envCheck.warnings.forEach(warn => console.log(`   💡 ${warn}`));
console.log('-----------------------------------------');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ─── Rate Limiters ───────────────────────────────────────────────────────────
// AI endpoints: 10 requests per minute per IP to prevent API key exhaustion
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak permintaan AI. Harap tunggu 60 detik sebelum mencoba lagi.' },
});

// Auth endpoints: 5 requests per minute per IP to prevent brute-force
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak percobaan login. Harap tunggu 60 detik.' },
});

// Mount observational logging middleware
app.use(requestLogger);
app.use(standardizeApiErrorResponse);

// Body limits configured for rich-media uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Lazy initializer for Google GenAI SDK to avoid module-load crashes if API key is omitted
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiClient) return aiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please configure it in the Secrets panel in AI Studio.');
  }

  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return aiClient;
}

// 1. Health verification api
app.get('/api/health', (req, res) => {
  const database = getDatabaseHealthSnapshot();
  res.status(database.healthy ? 200 : 503).json({
    status: database.healthy ? 'ok' : 'degraded',
    serverTime: new Date().toISOString(),
    database,
    message: database.healthy
      ? 'Server siap.'
      : 'Server sedang sibuk, data Anda aman dan akan dicoba kembali.',
  });
});

// PWA & Service Worker Awareness Endpoint
app.get('/api/system/pwa-status', (req, res) => {
  res.json({
    status: 'ok',
    offlineSupport: true,
    syncStrategy: 'stale-while-revalidate',
    manifestUrl: '/manifest.webmanifest',
    fallbackPageUrl: '/offline.html'
  });
});

app.get('/api/system/security-status', (req, res) => {
  const currentCheck = validateEnvironment();
  const hasGemini = !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MY_');
  const hasWhatsApp = !!process.env.WHATSAPP_API_URL && !!process.env.WHATSAPP_API_TOKEN;
  const database = getDatabaseHealthSnapshot();

  res.json({
    success: true,
    data: {
      ...currentCheck,
      modes: {
        ai: hasGemini ? 'enabled' : 'disabled',
        whatsapp: hasWhatsApp ? 'live' : 'simulation',
        storage: database.healthy ? 'supabase-postgres' : 'unavailable'
      },
      database
    }
  });
});


// Public Authentication endpoints (rate limited)
app.use('/api/auth', authRateLimiter, authRouter);

// Register Analysis History endpoints (Protected)
app.use('/api/analysis-history', authMiddleware, analysisHistoryRouter);

// Register Business Profile endpoints (Protected)
app.use('/api/business-profile', authMiddleware, businessProfileRouter);

// Register Reports endpoints (Protected)
app.use('/api/reports', authMiddleware, reportsRouter);

// Register Business Chat endpoints (Protected)
app.use('/api/chat', authMiddleware, businessChatRouter);

// Register CRM Leads endpoints (Protected)
app.use('/api/crm', authMiddleware, crmRouter);

// Register Notifications, Automation and WhatsApp endpoints (Protected)
app.use('/api', authMiddleware, notificationsRouter);

// Register Forecasting & Risk AI endpoints (Protected)
app.use('/api/forecast', authMiddleware, forecastRouter);

// Register Team Management endpoints (Protected)
app.use('/api/team', teamRouter);

// Register Judge Demo Mode Scenario Seeding Endpoints (Protected)
app.use('/api/demo', authMiddleware, demoRouter);

// Register OCR Nota endpoints (Protected)
app.use('/api/ocr', authMiddleware, ocrRouter);

// Register Profit & Cashflow endpoints (Protected)
app.use('/api/cashflow', authMiddleware, cashflowRouter);

// Register Passive Intelligence endpoints (Protected)
app.use('/api', authMiddleware, passiveIntelligenceRouter);
app.use('/api', authMiddleware, businessMemoryRouter);
app.use('/api', authMiddleware, warungModeRouter);
app.use('/api', whatsappWebhookRouter);
app.use('/api', authMiddleware, founderDashboardRouter);

// Register Internal Scheduled Jobs endpoint (NO authMiddleware; protected by x-cron-secret)
app.use('/api', internalJobsRouter);

// 2. Autonomous Analysis Route (Protected + Rate Limited)
app.post('/api/analyze', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { fileData, fileName, fileType, textInput, businessType } = req.body;

    const ai = getAiClient();

    // Prepare content parts for Gemini Multimodal
    const promptParts: any[] = [];

    // Base system analyst framing
    let corePrompt = `You are BizPilot AI, an elite Chief Operating Officer and seasoned Business Analytics Consultant for Indonesian UMKM (Mikro, Kecil, dan Menengah) businesses.
We are analyzing an uploaded data file or manual customer feedback input for a business of type: "${businessType || 'F&B Cafe'}".

Identify key operational strengths, risks, inventory levels, sales patterns, customer service topics, and generate an actionable, highly practical operational roadmap (Daily Action Plan) tailored specifically to the context of Indonesian MSMEs.

`;

    if (textInput) {
      corePrompt += `\n--- MANUAL USER DATA OR TEXT REPORT ---\n${textInput}\n`;
    }

    if (fileData && fileType) {
      if (fileType.startsWith('image/')) {
        corePrompt += `\nAn image attachment named "${fileName || 'attachment.png'}" has been uploaded. Analyze this image (which could be a screenshot of customer chats, a product screenshot, a physical receipt, an invoice, a dashboard graph, or inventory report) in detail. Extract any text, charts, line-items, prices, ratings, or complaints you discover within this image. Use these details to compute new metrics and formulate specific action recommendations.\n`;
        promptParts.push({
          inlineData: {
            mimeType: fileType,
            data: fileData,
          },
        });
      } else {
        // Plaintext contents such as CSV/TXT decoded
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const decodedText = buffer.toString('utf-8');
          corePrompt += `\n--- UPLOADED FILE CONTENTS (${fileName || 'data_file.csv'}) ---\n${decodedText}\n`;
        } catch (err) {
          corePrompt += `\n(An attached file named "${fileName}" could not be parsed to text: ${err instanceof Error ? err.message : String(err)})\n`;
        }
      }
    }

    // Direct Gemini strict JSON guidelines and formulas constraints:
    corePrompt += `
CRITICAL INSTRUCTIONS FOR ANALYSIS:
1. Business Health Score (0-100):
   Calculate an intelligent health score. Base it logically on the findings:
   - High customer complaints or severe out-of-stock items should reduce the health score.
   - Robust revenue, high ratings, or clear inventory levels should strengthen it.
2. Strengths & Risks (at least 2 each):
   - Translate observations into concrete business bullet points.
   - Ground all points strictly in the Indonesian business landscape (Bahasa Indonesia).
3. Alerts (maximum 3):
   - Highlight high-priority notifications that require prompt business attention (e.g. out-of-stock warnings, negative ratings trend).
4. Sales Data (7-day trend):
   - Generate, adapt, or extrapolation a coherent 7-day sales and transaction history trend.
   - If the uploaded file is a sales list, extract the dates and sales amounts logically. If it is high-level, generate a realistic weekly series (up to today, May 22, 2026) that integrates of reflects the analysis.
5. Top Products:
   - Provide a list of up to 4 popular products with realistic stock numbers, sales numbers, and trend indicators ("up", "down", "flat").
6. Customer Reviews Summary:
   - Synthesize customer sentiments into topics, assigning average ratings (0.0 to 5.0) and counts.
7. Action Plan (MOST IMPORTANT):
   - Generate up to 4 operational tasks.
   - Each task MUST have a high-impact, actionable title under 80 characters (written in a mixture of formal/business Bahasa Indonesia and simple terms, appropriate for UMKM workers).
   - Assign categories ("inventory" | "customer_service" | "marketing" | "operations" | "finance") and priority level ("high" | "medium" | "low").
   - Define a strong "reasoning" block explicitly warning of the operational risks if the task is neglected, and detailing the exact margin or optimization values of executing it.

Ensure all text descriptions are written in natural, highly supportive Bahasa Indonesia. Keep technical metrics easy to digest, with a futuristic, startup-grade predictive intelligence tone.

You MUST produce a JSON response adhering to the exact schema requested.`;

    promptParts.push({ text: corePrompt });

    // Structured JSON ResponseSchema definition
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        health_score: {
          type: Type.INTEGER,
          description: "Global business health score out of 100",
        },
        health_summary: {
          type: Type.STRING,
          description: "An expert summary of the business operations, risks, and suggestions",
        },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Strengths found in operations",
        },
        risks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Potential business operational hazards or issues",
        },
        sales_trend: {
          type: Type.STRING,
          description: "Overall transaction direction, must be: 'up' or 'down' or 'flat'",
        },
        alerts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Emergency alerts needing immediate view"
        },
        sales_data: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Display date e.g. '18 Mei'" },
              sales: { type: Type.NUMBER, description: "Total sales revenue in IDR currency" },
              transactions: { type: Type.INTEGER, description: "Total customer count" },
            },
            required: ["date", "sales", "transactions"],
          },
        },
        top_products: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the item" },
              sales: { type: Type.NUMBER, description: "Units sold or revenue share" },
              stock: { type: Type.INTEGER, description: "Current inventory balance" },
              trend: { type: Type.STRING, description: "Item momentum: 'up' | 'down' | 'flat'" },
            },
            required: ["name", "sales", "stock", "trend"],
          },
        },
        customer_reviews_summary: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING, description: "Topic cluster, e.g. Kecepatan Pelayanan" },
              rating: { type: Type.NUMBER, description: "Average rating scored" },
              count: { type: Type.INTEGER, description: "Total frequency of comments" },
              sentiment: { type: Type.STRING, description: "Topic status: 'positive' | 'negative' | 'neutral'" },
            },
            required: ["topic", "rating", "count", "sentiment"],
          },
        },
        action_plan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER, description: "Sequential id" },
              priority: { type: Type.STRING, description: "Priority scale: 'high' | 'medium' | 'low'" },
              task: { type: Type.STRING, description: "Operational step statement" },
              category: { type: Type.STRING, description: "Category string: 'inventory' | 'customer_service' | 'marketing' | 'operations' | 'finance'" },
              reasoning: { type: Type.STRING, description: "Warning reasoning details" },
            },
            required: ["id", "priority", "task", "category", "reasoning"],
          },
        },
      },
      required: [
        "health_score",
        "health_summary",
        "strengths",
        "risks",
        "sales_trend",
        "alerts",
        "sales_data",
        "top_products",
        "customer_reviews_summary",
        "action_plan",
      ],
    };

    // Query Gemini 2.0 Flash (stable production model)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: promptParts },
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2, // low temperature for precise factual reasoning
      },
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Gemini Analysis Failed:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Gemini Analysis Engine failed to process your business query.',
    });
  }
});

// Post-routing Global Error Formatter
app.use(errorHandler);

// 3. Vite Server / Production SPA Static Handler Pipeline
async function runServer() {
  const dbHealth = await verifyDatabaseHealth();
  if (dbHealth.healthy) {
    console.log('Database Mode: Supabase PostgreSQL verified. Running in Cloud-Native Mode.');
  } else {
    console.warn('Database Mode: degraded. Database operations will fail safely without writing to local files.', dbHealth.lastError);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BizPilot AI Core Engine boot coordinates: port ${PORT}`);
  });
}

runServer().catch((err) => {
  console.error('BizPilot AI Server Boot Error:', err);
});
