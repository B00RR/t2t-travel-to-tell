import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  const { pendingCount, isOnline, isSyncing, retrySync } = useOfflineSync();
  const { t } = useTranslation();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  if (!isOnline) {
    return (
      <View style={styles.banner} data-testid="offline-banner">
        <Ionicons name="cloud-offline" size={18} color="#fff" style={styles.icon} />
        <Text style={styles.text}>{t('offline.offline_mode')}</Text>
        {pendingCount > 0 && (
          <Text style={styles.pending}>
            {t('offline.pending_actions', { count: pendingCount })}
          </Text>
        )}
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View style={[styles.banner, styles.syncing]} data-testid="sync-banner">
        <Ionicons name="sync" size={18} color="#fff" style={styles.icon} />
        <Text style={styles.text}>{t('offline.syncing')}</Text>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <TouchableOpacity 
        style={[styles.banner, styles.pending_banner]} 
        onPress={retrySync}
        data-testid="pending-banner"
      >
        <Ionicons name="cloud-upload" size={18} color="#fff" style={styles.icon} />
        <Text style={styles.text}>
          {t('offline.pending_actions', { count: pendingCount })}
        </Text>
        <Text style={styles.tap_to_sync}>{t('offline.tap_to_sync')}</Text>
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f97316',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncing: {
    backgroundColor: '#3b82f6',
  },
  pending_banner: {
    backgroundColor: '#eab308',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  pending: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  tap_to_sync: {
    color: '#fff',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
