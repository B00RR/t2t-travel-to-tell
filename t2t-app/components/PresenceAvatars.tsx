import React, { useMemo } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { PresenceUser } from '@/hooks/useRealtimeDiary';

interface PresenceAvatarsProps {
  collaborators: PresenceUser[];
  currentUserId?: string;
  maxVisible?: number;
}

export function PresenceAvatars({ collaborators, currentUserId, maxVisible = 4 }: PresenceAvatarsProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const visibleCollaborators = useMemo(() => {
    return collaborators
      .filter(c => c.user_id !== currentUserId)
      .slice(0, maxVisible);
  }, [collaborators, currentUserId, maxVisible]);

  const overflowCount = useMemo(() => {
    return Math.max(0, collaborators.filter(c => c.user_id !== currentUserId).length - maxVisible);
  }, [collaborators, currentUserId, maxVisible]);

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleCollaborators.map((collab, index) => (
        <View
          key={collab.user_id}
          style={[
            styles.avatarWrapper,
            {
              borderColor: theme.bg,
              zIndex: maxVisible - index,
              marginLeft: index > 0 ? -12 : 0,
            },
          ]}
        >
          {collab.avatar_url ? (
            <Image
              source={{ uri: collab.avatar_url }}
              style={[styles.avatar, { borderColor: theme.bg }]}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.teal }]}>
              <Text style={styles.avatarInitial}>
                {(collab.display_name || collab.username || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          {collab.status === 'editing' && (
            <View style={[styles.editingIndicator, { backgroundColor: theme.orange }]} />
          )}
        </View>
      ))}
      {overflowCount > 0 && (
        <View style={[styles.overflowBadge, { backgroundColor: theme.bgElevated }]}>
          <Text style={[styles.overflowText, { color: theme.textSecondary }]}>
            +{overflowCount}
          </Text>
        </View>
      )}
      <Text style={[styles.statusText, { color: theme.textMuted }]}>
        {collaborators.length === 1
          ? t('realtime.collaborator_online', { name: collaborators[0].display_name || collaborators[0].username || 'User' })
          : t('realtime.collaborators_online', { count: collaborators.length })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editingIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  overflowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  overflowText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
  },
});
