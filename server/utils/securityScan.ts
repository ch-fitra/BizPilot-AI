import fs from 'fs/promises';
import path from 'path';

interface ScanResult {
  filePath: string;
  violations: {
    line: number;
    rule: string;
    description: string;
    severity: 'high' | 'medium';
  }[];
}

const FORBIDDEN_PATTERNS = [
  {
    regex: /AIzaSy[A-Za-z0-9_-]{33}/,
    rule: 'GOOGLE_API_KEY',
    description: 'Bocoran Google API Key / Gemini API Key.',
    severity: 'high' as const
  },
  {
    regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
    rule: 'JWT_OR_SERVICE_ROLE_TOKEN',
    description: 'JWT atau Supabase service role token keras terdeteksi.',
    severity: 'high' as const
  },
  {
    regex: /JWT_SECRET\s*[:=]\s*['"](?!your-|placeholder|change-me|dev-only)[^'"]{12,}['"]/i,
    rule: 'JWT_SECRET_HARDCODED',
    description: 'JWT_SECRET tampak ditulis langsung dalam kode.',
    severity: 'high' as const
  },
  {
    regex: /sb_[a-f0-9]{32}/,
    rule: 'SUPABASE_API_KEY',
    description: 'Supabase service role/anon key keras terdeteksi.',
    severity: 'high' as const
  },
  {
    regex: /FONNTE_[A-Za-z0-9]{10,}/,
    rule: 'WHATSAPP_TOKEN_LEAK',
    description: 'WhatsApp Fonnte API token keras terdeteksi.',
    severity: 'high' as const
  },
  {
    regex: /WHATSAPP_API_TOKEN\s*[:=]\s*['"](?!your-|placeholder|change-me|dev-only)[^'"]{10,}['"]/i,
    rule: 'WHATSAPP_TOKEN_HARDCODED',
    description: 'WHATSAPP_API_TOKEN tampak ditulis langsung dalam kode.',
    severity: 'high' as const
  }
];

const IGNORED_PATHS = [
  'node_modules',
  'dist',
  '.git',
  '.next',
  'package-lock.json',
  'coverage',
  'skills'
];

const SCANNABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.md'];

function shouldScanFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  const isPrivateEnv = fileName === '.env' || (fileName.startsWith('.env.') && fileName !== '.env.example');
  return isPrivateEnv || SCANNABLE_EXTENSIONS.includes(ext);
}

async function scanDirectory(dir: string, results: ScanResult[] = []): Promise<ScanResult[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_PATHS.includes(entry.name)) continue;
      await scanDirectory(fullPath, results);
    } else if (shouldScanFile(fullPath)) {
      await scanFile(fullPath, results);
    }
  }

  return results;
}

async function scanFile(filePath: string, results: ScanResult[]): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations: ScanResult['violations'] = [];
    const fileName = path.basename(filePath);

    if (fileName === '.env' || (fileName.startsWith('.env.') && fileName !== '.env.example')) {
      violations.push({
        line: 0,
        rule: 'ENV_FILE_PRESENT',
        description: 'Berkas private env tidak boleh berada di repositori. Gunakan .env.example untuk template aman.',
        severity: 'high'
      });
    }

    if (!filePath.endsWith('.env.example')) {
      lines.forEach((lineText, idx) => {
        FORBIDDEN_PATTERNS.forEach(({ regex, rule, description, severity }) => {
          if (regex.test(lineText)) {
            violations.push({
              line: idx + 1,
              rule,
              description,
              severity
            });
          }
        });
      });
    }

    if (violations.length > 0) {
      results.push({
        filePath: path.relative(process.cwd(), filePath),
        violations
      });
    }
  } catch {
    // Ignore binary/permission errors.
  }
}

async function runScan() {
  console.log('[security:scan] Memulai Static Secret Safety Scan BizPilot AI...');

  try {
    const results = await scanDirectory(process.cwd());

    console.log('\n--- HASIL PENILAIAN KEAMANAN ---');
    if (results.length === 0) {
      console.log('[OK] Tidak ditemukan kebocoran secret atau API key.');
      process.exit(0);
    }

    let highAlertCount = 0;
    results.forEach((result) => {
      console.warn(`[WARN] Berkas: ${result.filePath}`);
      result.violations.forEach((violation) => {
        if (violation.severity === 'high') highAlertCount++;
        console.warn(`   [Baris ${violation.line}] [${violation.rule}] [${violation.severity.toUpperCase()}]: ${violation.description}`);
      });
    });

    console.warn(`\n[FAIL] Total high severity alerts: ${highAlertCount}`);
    if (highAlertCount > 0) {
      console.warn('[FAIL] Bersihkan secret sebelum build production.');
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('[security:scan] Gagal menjalankan scan:', err);
    process.exit(1);
  }
}

runScan();
