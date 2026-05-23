import { Request, Response, NextFunction } from 'express';

function statusToCode(statusCode: number): string {
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode === 422) return 'VALIDATION_ERROR';
  if (statusCode >= 500) return 'INTERNAL_SERVER_ERROR';
  return 'REQUEST_FAILED';
}

export function standardizeApiErrorResponse(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = ((body: any) => {
    if (body && body.success === false) {
      const rawError = body.error;
      const details = body.details || (typeof rawError === 'object' ? rawError.details : {}) || {};

      if (typeof rawError === 'string') {
        return originalJson({
          ...body,
          error: {
            code: body.code || statusToCode(res.statusCode),
            message: rawError,
            details
          }
        });
      }

      if (!rawError || typeof rawError !== 'object' || !rawError.code || !rawError.message) {
        return originalJson({
          ...body,
          error: {
            code: rawError?.code || body.code || statusToCode(res.statusCode),
            message: rawError?.message || 'Permintaan gagal diproses.',
            details
          }
        });
      }
    }

    return originalJson(body);
  }) as Response['json'];

  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[CRITICAL SEVERITY EVENT]:', err);

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Terjadi kesalahan sistem internal pada BizPilot AI.';

  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details: err.details || {}
    }
  });
}
