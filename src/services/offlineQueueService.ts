import { OfflineQueueItem } from '../types/offline';

const OFFLINE_QUEUE_KEY = 'bizpilot_offline_queue';
const SENSITIVE_KEY_PATTERN = /(token|secret|password|authorization|api[_-]?key|service[_-]?role)/i;

function sanitizeForOfflineQueue(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForOfflineQueue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
        .map(([key, item]) => [key, sanitizeForOfflineQueue(item)])
    );
  }

  return value;
}

export class OfflineQueueService {
  static getQueue(): OfflineQueueItem[] {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (err) {
      console.error('Failed to parse offline queue:', err);
      return [];
    }
  }

  static saveQueue(queue: OfflineQueueItem[]): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('Failed to write to offline queue:', err);
    }
  }

  static enqueue(
    action: OfflineQueueItem['action'],
    payload: any
  ): OfflineQueueItem {
    const queue = this.getQueue();
    const newItem: OfflineQueueItem = {
      id: `off_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      payload: sanitizeForOfflineQueue(payload),
      timestamp: Date.now(),
      syncStatus: 'pending'
    };
    
    queue.push(newItem);
    this.saveQueue(queue);
    
    // Dispatch custom event to let components react with toast notifications instantly
    window.dispatchEvent(new CustomEvent('bizpilot-offline-queue-changed'));
    return newItem;
  }

  static dequeue(id: string): void {
    let queue = this.getQueue();
    queue = queue.filter(item => item.id !== id);
    this.saveQueue(queue);
    window.dispatchEvent(new CustomEvent('bizpilot-offline-queue-changed'));
  }

  static updateStatus(id: string, status: OfflineQueueItem['syncStatus'], errorMsg?: string): void {
    const queue = this.getQueue();
    const item = queue.find(i => i.id === id);
    if (item) {
      item.syncStatus = status;
      if (errorMsg) item.errorMsg = errorMsg;
      this.saveQueue(queue);
      window.dispatchEvent(new CustomEvent('bizpilot-offline-queue-changed'));
    }
  }

  static clear(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    window.dispatchEvent(new CustomEvent('bizpilot-offline-queue-changed'));
  }
}
