import { OfflineQueueService } from './offlineQueueService';
import { OfflineQueueItem } from '../types/offline';

let isSyncInProgress = false;

export class SyncService {
  static isSyncing(): boolean {
    return isSyncInProgress;
  }

  static async syncAllPending(): Promise<{ successCount: number; failedCount: number }> {
    if (isSyncInProgress) {
      return { successCount: 0, failedCount: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Sync skipped: Device is offline.');
      return { successCount: 0, failedCount: 0 };
    }

    const queue = OfflineQueueService.getQueue();
    if (queue.length === 0) {
      return { successCount: 0, failedCount: 0 };
    }

    isSyncInProgress = true;
    window.dispatchEvent(new CustomEvent('bizpilot-sync-state-changed', { detail: { isSyncing: true } }));

    let successCount = 0;
    let failedCount = 0;

    console.log(`[SyncService] Starting sync for ${queue.length} offline operations...`);

    for (const item of queue) {
      try {
        OfflineQueueService.updateStatus(item.id, 'syncing');
        await this.syncItem(item);
        OfflineQueueService.dequeue(item.id);
        successCount++;
        console.log(`[SyncService] Successfully synced task ${item.id} (${item.action})`);
      } catch (err: any) {
        failedCount++;
        console.error(`[SyncService] Failed to sync task ${item.id} (${item.action}):`, err);
        OfflineQueueService.updateStatus(item.id, 'failed', err.message || 'Unknown network error');
        
        // If it's a structural network error (device offline or server unreachable), exit loop to avoid spamming
        if (err.message?.includes('fetch') || err.message?.includes('Network') || err.message?.includes('Failed to fetch')) {
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
        timestamp: Date.now()
      } 
    }));

    return { successCount, failedCount };
  }

  private static async syncItem(item: OfflineQueueItem): Promise<void> {
    const token = localStorage.getItem('bizpilot_token');
    const activeBizId = localStorage.getItem('bizpilot_active_business_id');

    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (activeBizId) {
      headers['x-business-id'] = activeBizId;
    }

    let response: Response;

    switch (item.action) {
      case 'save_analysis': {
        response = await fetch('/api/analysis-history', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload)
        });
        break;
      }

      case 'save_business_profile': {
        const { id, profile } = item.payload;
        if (id) {
          response = await fetch(`/api/business-profile/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(profile)
          });
        } else {
          response = await fetch('/api/business-profile', {
            method: 'POST',
            headers,
            body: JSON.stringify(profile)
          });
        }
        break;
      }

      case 'create_crm_lead': {
        response = await fetch('/api/crm/leads', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload)
        });
        break;
      }

      case 'update_crm_stage': {
        const { id, updates } = item.payload;
        response = await fetch(`/api/crm/leads/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updates)
        });
        break;
      }

      case 'create_notification': {
        response = await fetch('/api/notifications', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload)
        });
        break;
      }

      case 'save_action_plan': {
        // Standard action items can be posted directly via system sweep or lead updating
        response = await fetch('/api/notifications', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload)
        });
        break;
      }

      default:
        throw new Error(`Unsupported sync action: ${item.action}`);
    }

    if (!response.ok) {
      const errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const data = await response.json();
        throw new Error(data.error || data.message || errorMsg);
      } catch {
        throw new Error(errorMsg);
      }
    }
  }
}

// Global window event listener to automatically trigger sync loop when connectivity is recovered
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncService] Online signal captured. Flushing offline operations...');
    // Introduce short artificial stagger to let routes settle
    setTimeout(() => {
      SyncService.syncAllPending()
        .then(({ successCount }) => {
          if (successCount > 0) {
            console.log(`[SyncService] Autonomic system flushed ${successCount} queued elements.`);
          }
        })
        .catch(err => {
          console.error('[SyncService] Autonomic routine catch failed:', err);
        });
    }, 2000);
  });
}
