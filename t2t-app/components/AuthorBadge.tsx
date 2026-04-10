import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { EntryAuthor } from '@/types/dayEntry';

interface AuthorBadgeProps {
  author: EntryAuthor | null | undefined;
  size?: 'sm' | 'md';
}

/**
 * Small avatar + name badge for an entry author.
 * Shown on day_entries when the diary is collaborative so readers
 * can tell who wrote each block.
 */
export function AuthorBadge({ author, size = 'sm' }: AuthorBadgeProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const name = author?.display_name || author?.username || t('collab.unknown_author');
  const avatarSize = size === 'md' ? 24 : 18;

  return (
    <View style={styles.container}>
      {author?.avatar_url ? (
        <Image
          source={{ uri: author.avatar_url }}
          style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: theme.bgElevated,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.avatarInitial, { color: theme.textMuted }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={[styles.name, { color: theme.textMuted }]} numberOfLines={1}>
        {t('collab.by_author', { name })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  avatar: {
    resizeMode: 'cover',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: '700',
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
