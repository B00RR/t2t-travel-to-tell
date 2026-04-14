import { useEffect, useState, useCallback } from 'react';
import { syncManager } from '../lib/offline';

export interface OfflineSyncState {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

export interface OfflineSyncActions {
  retrySync: () => Promise<void>;
  clearQueue: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useOfflineSync(): OfflineSyncState & OfflineSyncActions {
  const [state, setState] = useState<OfflineSyncState>({
    pendingCount: 0,
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
  });

  useEffect(() => {
    syncManager.initialize();

    const unsubscribe = syncManager.onSyncStateChange((pendingCount, isOnline) => {
      setState(prev => ({
        ...prev,
        pendingCount,
        isOnline,
      }));
    });

    syncManager.getStatus().then(status => {
      setState(prev => ({
        ...prev,
        pendingCount: status.pending,
        isOnline: status.isOnline,
      }));
    });

    return unsubscribe;
  }, []);

  const retrySync = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      await syncManager.processQueue();
      setState(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncTime: Date.now(),
      }));
    } catch {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, []);

  const clearQueue = useCallback(async () => {
    await syncManager.clearQueue();
    setState(prev => ({ ...prev, pendingCount: 0 }));
  }, []);

  const refreshStatus = useCallback(async () => {
    const status = await syncManager.getStatus();
    setState(prev => ({
      ...prev,
      pendingCount: status.pending,
      isOnline: status.isOnline,
    }));
  }, []);

  return {
    ...state,
    retrySync,
    clearQueue,
    refreshStatus,
  };
}
