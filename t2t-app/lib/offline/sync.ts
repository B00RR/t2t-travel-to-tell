import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabase';
import { offlineQueue } from './queue';
import { OfflineAction } from './types';

type SyncCallback = (pendingCount: number, isOnline: boolean) => void;

let syncCallbacks: SyncCallback[] = [];
let isProcessing = false;
let isOnline = true;

export const syncManager = {
  async initialize(): Promise<void> {
    const netInfoState = await NetInfo.fetch();
    isOnline = netInfoState.isConnected ?? true;

    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      isOnline = state.isConnected ?? true;
      
      if (wasOffline && isOnline) {
        console.log('[SyncManager] Back online, triggering sync...');
        this.processQueue();
      }

      this.notifyCallbacks();
    });

    if (isOnline) {
      this.processQueue();
    }
  },

  onSyncStateChange(callback: SyncCallback): () => void {
    syncCallbacks.push(callback);
    return () => {
      syncCallbacks = syncCallbacks.filter(cb => cb !== callback);
    };
  },

  async notifyCallbacks(): Promise<void> {
    const pendingCount = await offlineQueue.getPendingCount();
    for (const callback of syncCallbacks) {
      callback(pendingCount, isOnline);
    }
  },

  async processQueue(): Promise<void> {
    if (isProcessing || !isOnline) {
      return;
    }

    isProcessing = true;
    console.log('[SyncManager] Processing queue...');

    try {
      const pendingActions = await offlineQueue.getPendingActions();
      
      for (const action of pendingActions) {
        if (!isOnline) {
          console.log('[SyncManager] Went offline, stopping queue processing');
          break;
        }

        await offlineQueue.updateAction(action.id, { status: 'processing' });
        
        try {
          await this.executeAction(action);
          await offlineQueue.removeAction(action.id);
          console.log('[SyncManager] Action synced:', action.id);
        } catch (error) {
          console.error('[SyncManager] Action failed:', action.id, error);
          const canRetry = await offlineQueue.incrementRetry(action.id);
          
          if (!canRetry) {
            console.warn('[SyncManager] Action exceeded max retries, marking as failed:', action.id);
            await offlineQueue.updateAction(action.id, { status: 'failed' });
          } else {
            await offlineQueue.updateAction(action.id, { status: 'pending' });
          }
        }
      }
    } finally {
      isProcessing = false;
      await this.notifyCallbacks();
    }
  },

  async executeAction(action: OfflineAction): Promise<void> {
    const { type, table, data } = action;

    switch (type) {
      case 'CREATE':
        const { data: createdData, error: createError } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        
        if (createError) throw createError;
        return createdData;

      case 'UPDATE':
        const { error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq('id', data.id as string);
        
        if (updateError) throw updateError;
        return;

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', data.id as string);
        
        if (deleteError) throw deleteError;
        return;

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  },

  async getStatus(): Promise<{ pending: number; isOnline: boolean }> {
    const pending = await offlineQueue.getPendingCount();
    return { pending, isOnline };
  },

  async clearQueue(): Promise<void> {
    await offlineQueue.clearAll();
    await this.notifyCallbacks();
  },

  async retryFailed(): Promise<void> {
    const failed = await offlineQueue.getFailedActions();
    for (const action of failed) {
      await offlineQueue.updateAction(action.id, { status: 'pending', retryCount: 0 });
    }
    await this.processQueue();
  },
};
