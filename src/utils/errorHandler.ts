export interface ApiErrorShape {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function parseApiError(payload: any, fallback = 'Permintaan gagal diproses.'): ApiErrorShape {
  if (payload?.error && typeof payload.error === 'object') {
    return {
      code: payload.error.code || 'REQUEST_FAILED',
      message: payload.error.message || fallback,
      details: payload.error.details || {}
    };
  }

  if (typeof payload?.error === 'string') {
    return {
      code: payload.code || 'REQUEST_FAILED',
      message: payload.error,
      details: payload.details || {}
    };
  }

  return {
    code: 'REQUEST_FAILED',
    message: fallback,
    details: {}
  };
}

export function logClientEvent(type: string, metadata: Record<string, unknown> = {}) {
  const event = {
    type,
    metadata,
    createdAt: new Date().toISOString()
  };
  const current = JSON.parse(localStorage.getItem('bizpilot_client_events') || '[]');
  localStorage.setItem('bizpilot_client_events', JSON.stringify([event, ...current].slice(0, 100)));
}

export function getClientEvents() {
  return JSON.parse(localStorage.getItem('bizpilot_client_events') || '[]');
}
