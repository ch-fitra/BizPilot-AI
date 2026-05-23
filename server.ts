import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 2. Autonomous Analysis Route
app.post('/api/analyze', async (req, res) => {
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

    // Query Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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

// 3. Vite Server / Production SPA Static Handler Pipeline
async function runServer() {
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
