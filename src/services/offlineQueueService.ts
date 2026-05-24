import { OfflineQueueItem } from '../types/offline';

const DB_NAME = 'bizpilot-offline-sync';
const DB_VERSION = 1;
const STORE_NAME = 'queue';
const MAX_QUEUE_ITEMS = 100;
const SENSITIVE_KEY_PATTERN = /(token|secret|password|authorization|api[_-]?key|service[_-]?role)/i;
const ALLOWED_ACTIONS: OfflineQueueItem['action'][] = [
  'save_analysis',
  'save_business_profile',
  'create_crm_lead',
  'update_crm_stage',
  'create_notification',
  'save_action_plan',
  'save_warung_transaction',
];

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

  if (typeof value === 'string') {
    return value.slice(0, 20000);
  }

  return value;
}

function stableStringify(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function buildDedupeKey(action: OfflineQueueItem['action'], payload: any): string {
  return `${action}:${stableStringify(payload)}`;
}

function assertValidQueueItem(action: OfflineQueueItem['action'], payload: any) {
  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new Error('Aksi offline tidak valid.');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Payload offline harus berupa objek JSON valid.');
  }
}

function dispatchQueueChanged() {
  window.dispatchEvent(new CustomEvent('bizpilot-offline-queue-changed'));
}

export class OfflineQueueService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('dedupeKey', 'dedupeKey', { unique: true });
          store.createIndex('syncStatus', 'syncStatus');
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private static async transaction<T>(
    mode: IDBTransactionMode,
    executor: (store: IDBObjectStore) => IDBRequest<T> | void
  ): Promise<T | void> {
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const request = executor(store);

      if (request) {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }

      tx.oncomplete = () => {
        if (!request) resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  static async getQueue(): Promise<OfflineQueueItem[]> {
    if (typeof indexedDB === 'undefined') return [];

    const items = await this.transaction<OfflineQueueItem[]>('readonly', (store) => store.getAll());
    return (items || []).sort((a, b) => a.timestamp - b.timestamp);
  }

  static async saveQueue(queue: OfflineQueueItem[]): Promise<void> {
    if (typeof indexedDB === 'undefined') return;

    const sanitized = queue.slice(-MAX_QUEUE_ITEMS);
    await this.transaction('readwrite', (store) => {
      store.clear();
      sanitized.forEach((item) => store.put(item));
    });
    dispatchQueueChanged();
  }

  static async enqueue(action: OfflineQueueItem['action'], payload: any): Promise<OfflineQueueItem> {
    assertValidQueueItem(action, payload);

    const sanitizedPayload = sanitizeForOfflineQueue(payload);
    const dedupeKey = buildDedupeKey(action, sanitizedPayload);
    const queue = await this.getQueue();
    const existing = queue.find((item) => item.dedupeKey === dedupeKey && item.syncStatus !== 'syncing');

    if (existing) {
      existing.timestamp = Date.now();
      existing.syncStatus = 'pending';
      existing.errorMsg = undefined;
      await this.updateItem(existing);
      return existing;
    }

    const newItem: OfflineQueueItem = {
      id: `off_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      payload: sanitizedPayload,
      timestamp: Date.now(),
      syncStatus: 'pending',
      attemptCount: 0,
      dedupeKey,
    };

    const trimmedQueue = [...queue, newItem].slice(-MAX_QUEUE_ITEMS);
    await this.saveQueue(trimmedQueue);
    return newItem;
  }

  static async dequeue(id: string): Promise<void> {
    await this.transaction('readwrite', (store) => store.delete(id));
    dispatchQueueChanged();
  }

  static async updateItem(item: OfflineQueueItem): Promise<void> {
    await this.transaction('readwrite', (store) => store.put(item));
    dispatchQueueChanged();
  }

  static async updateStatus(
    id: string,
    status: OfflineQueueItem['syncStatus'],
    errorMsg?: string
  ): Promise<void> {
    const queue = await this.getQueue();
    const item = queue.find((candidate) => candidate.id === id);
    if (!item) return;

    item.syncStatus = status;
    item.errorMsg = errorMsg;
    if (status === 'failed') {
      item.attemptCount = (item.attemptCount || 0) + 1;
    }

    await this.updateItem(item);
  }

  static async clear(): Promise<void> {
    await this.transaction('readwrite', (store) => store.clear());
    dispatchQueueChanged();
  }
}
