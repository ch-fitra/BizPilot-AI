import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { OfflineQueueService } from '../services/offlineQueueService';
import { SyncService } from '../services/syncService';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showStatusBubble, setShowStatusBubble] = useState<boolean>(true);

  // Sync count update handler
  const updatePendingCount = async () => {
    const queue = await OfflineQueueService.getQueue();
    setPendingCount(queue.length);
  };

  useEffect(() => {
    void updatePendingCount();

    // Event listeners
    window.addEventListener('bizpilot-offline-queue-changed', updatePendingCount);
    
    const handleSyncState = (e: any) => {
      setIsSyncing(!!e.detail?.isSyncing);
      void updatePendingCount();
    };
    window.addEventListener('bizpilot-sync-state-changed', handleSyncState);

    return () => {
      window.removeEventListener('bizpilot-offline-queue-changed', updatePendingCount);
      window.removeEventListener('bizpilot-sync-state-changed', handleSyncState);
    };
  }, []);

  const handleManualSync = async () => {
    if (isOnline && pendingCount > 0) {
      await SyncService.syncAllPending();
    }
  };

  return (
    <div id="offline-manager-layer" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none font-sans">
      <AnimatePresence>
        {/* 1. Offline Notification Bar */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md text-amber-300 px-4 py-3 rounded-xl shadow-xl max-w-sm"
          >
            <WifiOff className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
            <div className="flex-1 text-left">
              <h4 id="offline-lbl-title" className="text-xs font-bold uppercase tracking-wider text-amber-400">Mode Offline Aktif</h4>
              <p id="offline-lbl-desc" className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Server sedang sibuk, data Anda aman dan akan dicoba kembali.
              </p>
            </div>
          </motion.div>
        )}

        {/* 2. Syncing Status indicator */}
        {isOnline && pendingCount > 0 && showStatusBubble && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="pointer-events-auto flex items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md text-emerald-300 px-4 py-3 rounded-xl shadow-xl max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div className="text-left">
                <h4 id="pending-lbl-title" className="text-xs font-bold uppercase tracking-wider text-emerald-400">Draf Pending Terdaftar</h4>
                <p id="pending-lbl-desc" className="text-xs text-slate-300 mt-0.5">
                  {pendingCount} perubahan siap disinkronisasikan.
                </p>
              </div>
            </div>
            <button
              id="sync-manual-btn"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-2.5 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 hover:bg-emerald-400 transition"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sinking...' : 'Sinkron'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
