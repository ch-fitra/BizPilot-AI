import { OfflineQueueService } from './offlineQueueService';
import { OfflineQueueItem } from '../types/offline';

let isSyncInProgress = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
  const message = String(error?.message || error || '');
  return (
    message.includes('fetch') ||
    message.includes('Network') ||
    message.includes('Failed to fetch') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('504')
  );
}

export class SyncService {
  static isSyncing(): boolean {
    return isSyncInProgress;
  }

  static async syncAllPending(): Promise<{ successCount: number; failedCount: number }> {
    if (isSyncInProgress) {
      return { successCount: 0, failedCount: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { successCount: 0, failedCount: 0 };
    }

    const queue = (await OfflineQueueService.getQueue()).filter((item) => item.syncStatus !== 'syncing');
    if (queue.length === 0) {
      return { successCount: 0, failedCount: 0 };
    }

    isSyncInProgress = true;
    window.dispatchEvent(new CustomEvent('bizpilot-sync-state-changed', { detail: { isSyncing: true } }));

    let successCount = 0;
    let failedCount = 0;

    for (const item of queue) {
      try {
        await OfflineQueueService.updateStatus(item.id, 'syncing');
        await this.syncItemWithBackoff(item);
        await OfflineQueueService.dequeue(item.id);
        successCount += 1;
      } catch (err: any) {
        failedCount += 1;
        await OfflineQueueService.updateStatus(item.id, 'failed', err.message || 'Unknown network error');

        if (isRetryableError(err)) {
          break;
        }
      }
    }

    isSyncInProgress = false;
    window.dispatchEvent(new CustomEvent('bizpilot-sync-state-changed', {
      detail: {
        isSyncing: false,
        lastSuccessCount: successCount,
        lastFailedCount: failedCount,
        timestamp: Date.now(),
      },
    }));

    return { successCount, failedCount };
  }

  private static async syncItemWithBackoff(item: OfflineQueueItem): Promise<void> {
    let lastError: any;
    const attempts = 3;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        await this.syncItem(item);
        return;
      } catch (err) {
        lastError = err;
        if (!isRetryableError(err) || attempt === attempts - 1) {
          break;
        }
        await sleep(500 * 2 ** attempt);
      }
    }

    throw lastError;
  }

  private static async syncItem(item: OfflineQueueItem): Promise<void> {
    const token = localStorage.getItem('bizpilot_token');
    const activeBizId = localStorage.getItem('bizpilot_active_business_id');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-idempotency-key': item.dedupeKey || item.id,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (activeBizId) {
      headers['x-business-id'] = activeBizId;
    }

    let response: Response;

    switch (item.action) {
      case 'save_analysis':
        response = await fetch('/api/analysis-history', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload),
        });
        break;

      case 'save_business_profile': {
        const { id, profile } = item.payload;
        response = await fetch(id ? `/api/business-profile/${id}` : '/api/business-profile', {
          method: id ? 'PUT' : 'POST',
          headers,
          body: JSON.stringify(profile),
        });
        break;
      }

      case 'create_crm_lead':
        response = await fetch('/api/crm/leads', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload),
        });
        break;

      case 'update_crm_stage': {
        const { id, updates } = item.payload;
        response = await fetch(`/api/crm/leads/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updates),
        });
        break;
      }

      case 'create_notification':
      case 'save_action_plan':
        response = await fetch('/api/notifications', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload),
        });
        break;

      case 'save_warung_transaction':
        response = await fetch('/api/warung-mode/save-transaction', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload),
        });
        break;

      default:
        throw new Error(`Unsupported sync action: ${item.action}`);
    }

    if (!response.ok) {
      const errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const data = await response.json();
        throw new Error(data?.error?.message || data.error || data.message || errorMsg);
      } catch {
        throw new Error(errorMsg);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(() => {
      SyncService.syncAllPending().catch((err) => {
        console.error('[SyncService] Autonomic routine catch failed:', err);
      });
    }, 2000);
  });
}
