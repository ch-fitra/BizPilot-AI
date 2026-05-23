import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const url = req.originalUrl || req.url;
  const method = req.method;

  // Wait for request completion to compute stats
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Simple human-readable telemetry line
    console.log(`[BIZPILOT AUDIT] ${method} ${url} | Code: ${status} | Time: ${duration}ms`);
  });

  next();
}
