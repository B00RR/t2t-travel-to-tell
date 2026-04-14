import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@t2t_offline_queue',
  CACHED_DATA: '@t2t_cached_data',
  LAST_SYNC: '@t2t_last_sync',
  PENDING_COUNT: '@t2t_pending_count',
} as const;

export const storage = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[OfflineStorage] Error getting item:', key, error);
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('[OfflineStorage] Error setting item:', key, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[OfflineStorage] Error removing item:', key, error);
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const t2tKeys = keys.filter(k => k.startsWith('@t2t_'));
      await Promise.all(t2tKeys.map(k => AsyncStorage.removeItem(k)));
    } catch (error) {
      console.error('[OfflineStorage] Error clearing:', error);
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(k => k.startsWith('@t2t_'));
    } catch (error) {
      console.error('[OfflineStorage] Error getting keys:', error);
      return [];
    }
  },
};

export { STORAGE_KEYS };
