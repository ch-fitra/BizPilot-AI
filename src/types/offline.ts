export interface OfflineQueueItem {
  id: string;
  action: 'save_analysis' | 'save_business_profile' | 'create_crm_lead' | 'update_crm_stage' | 'create_notification' | 'save_action_plan' | 'save_warung_transaction';
  payload: any;
  timestamp: number;
  syncStatus: 'pending' | 'syncing' | 'failed';
  attemptCount?: number;
  dedupeKey?: string;
  errorMsg?: string;
}

export interface SyncStatusSummary {
  isConnected: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  status: 'synced' | 'pending' | 'failed' | 'offline_draft';
}
