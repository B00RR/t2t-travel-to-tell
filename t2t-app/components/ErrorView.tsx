import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorView = ({ message, onRetry }: ErrorViewProps) => {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Ionicons name="alert-circle-outline" size={64} color={theme.red} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>{t('common.error')}</Text>
      <Text style={[styles.message, { color: theme.textMuted }]}>{message || t('common.error_generic')}</Text>

      {onRetry && (
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.teal }]} onPress={onRetry}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
