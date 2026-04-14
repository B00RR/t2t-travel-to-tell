import { storage, STORAGE_KEYS } from './storage';
import { OfflineAction, QueueState } from './types';

const MAX_RETRIES = 3;

function generateId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const offlineQueue = {
  async getQueue(): Promise<OfflineAction[]> {
    const state = await storage.getItem<QueueState>(STORAGE_KEYS.OFFLINE_QUEUE);
    return state?.actions || [];
  },

  async saveQueue(actions: OfflineAction[]): Promise<void> {
    const state: QueueState = {
      actions,
      isProcessing: false,
      lastProcessedId: null,
    };
    await storage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, state);
    await this.updatePendingCount();
  },

  async addAction(
    type: OfflineAction['type'],
    table: OfflineAction['table'],
    data: Record<string, unknown>
  ): Promise<OfflineAction> {
    const action: OfflineAction = {
      id: generateId(),
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    const actions = await this.getQueue();
    actions.push(action);
    await this.saveQueue(actions);

    console.log('[OfflineQueue] Action added:', action.id, type, table);
    return action;
  },

  async removeAction(actionId: string): Promise<void> {
    const actions = await this.getQueue();
    const filtered = actions.filter(a => a.id !== actionId);
    await this.saveQueue(filtered);
  },

  async updateAction(actionId: string, updates: Partial<OfflineAction>): Promise<void> {
    const actions = await this.getQueue();
    const index = actions.findIndex(a => a.id === actionId);
    if (index !== -1) {
      actions[index] = { ...actions[index], ...updates };
      await this.saveQueue(actions);
    }
  },

  async incrementRetry(actionId: string): Promise<boolean> {
    const actions = await this.getQueue();
    const action = actions.find(a => a.id === actionId);
    if (!action) return false;

    action.retryCount += 1;
    if (action.retryCount >= MAX_RETRIES) {
      action.status = 'failed';
    }
    await this.saveQueue(actions);
    return action.retryCount < MAX_RETRIES;
  },

  async getPendingActions(): Promise<OfflineAction[]> {
    const actions = await this.getQueue();
    return actions.filter(a => a.status === 'pending');
  },

  async getFailedActions(): Promise<OfflineAction[]> {
    const actions = await this.getQueue();
    return actions.filter(a => a.status === 'failed');
  },

  async clearFailedActions(): Promise<void> {
    const actions = await this.getQueue();
    const pending = actions.filter(a => a.status !== 'failed');
    await this.saveQueue(pending);
  },

  async getPendingCount(): Promise<number> {
    const count = await storage.getItem<number>(STORAGE_KEYS.PENDING_COUNT);
    return count || 0;
  },

  async updatePendingCount(): Promise<void> {
    const pending = await this.getPendingActions();
    const failed = await this.getFailedActions();
    await storage.setItem(STORAGE_KEYS.PENDING_COUNT, pending.length + failed.length);
  },

  async clearAll(): Promise<void> {
    await storage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, { actions: [], isProcessing: false, lastProcessedId: null });
    await storage.setItem(STORAGE_KEYS.PENDING_COUNT, 0);
  },
};
