import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';
import type { TripPlanCollaborator } from '@/hooks/useTripPlanCollaborators';

interface TripPlanCollaboratorListItemProps {
  collaborator: TripPlanCollaborator;
  canRemove: boolean;
  onRemove: (id: string) => void;
  isPending?: boolean;
}

export function TripPlanCollaboratorListItem({
  collaborator,
  canRemove,
  onRemove,
  isPending,
}: TripPlanCollaboratorListItemProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const name =
    collaborator.profile?.display_name ||
    collaborator.profile?.username ||
    t('collab.unknown_author');
  const handle = collaborator.profile?.username;
  const avatarUrl = collaborator.profile?.avatar_url;

  const confirmRemove = () => {
    Alert.alert(
      t('collab.plan_remove_confirm_title'),
      t('collab.plan_remove_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('collab.remove'),
          style: 'destructive',
          onPress: () => onRemove(collaborator.id),
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bgSurface,
          borderColor: theme.border,
        },
      ]}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.bgElevated }]}>
          <Text style={[styles.avatarInitial, { color: theme.textPrimary }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        {handle ? (
          <Text style={[styles.handle, { color: theme.textMuted }]} numberOfLines={1}>
            @{handle}
          </Text>
        ) : null}
        <Text style={[styles.status, { color: isPending ? theme.orange : theme.sage }]}>
          {isPending ? t('collab.pending_section', { count: '' }).replace(/\s*\(\s*\)/, '') : t('collab.collab_label')}
        </Text>
      </View>
      {canRemove && (
        <TouchableOpacity
          onPress={confirmRemove}
          style={styles.removeBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('collab.remove')}
        >
          <Ionicons name="close-circle" size={24} color={theme.red} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  handle: {
    fontSize: 13,
    marginTop: 1,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeBtn: {
    padding: 4,
  },
});
