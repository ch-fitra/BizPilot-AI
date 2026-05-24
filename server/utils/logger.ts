const REDACT_PATTERNS = [
  /(authorization["']?\s*[:=]\s*["']?bearer\s+)[a-z0-9\-._~+/]+=*/gi,
  /(api[_-]?key["']?\s*[:=]\s*["']?)[^"'\s]+/gi,
  /(token["']?\s*[:=]\s*["']?)[^"'\s]+/gi,
  /(\+?62\d{6,13})/g,
];

function redact(input: unknown): string {
  let text = typeof input === 'string' ? input : JSON.stringify(input);
  for (const pattern of REDACT_PATTERNS) {
    text = text.replace(pattern, '$1[REDACTED]');
  }
  return text;
}

export const logger = {
  debug: (msg: string, meta?: unknown) => process.env.NODE_ENV !== 'production' && console.debug(`[DEBUG] ${msg}`, meta ? redact(meta) : ''),
  info: (msg: string, meta?: unknown) => console.info(`[INFO] ${msg}`, meta ? redact(meta) : ''),
  warn: (msg: string, meta?: unknown) => console.warn(`[WARN] ${msg}`, meta ? redact(meta) : ''),
  error: (msg: string, meta?: unknown) => console.error(`[ERROR] ${msg}`, meta ? redact(meta) : ''),
};
