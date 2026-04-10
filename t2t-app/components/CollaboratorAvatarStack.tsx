import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import type { DiaryCollaborator } from '@/types/collaboration';

interface CollaboratorAvatarStackProps {
  collaborators: DiaryCollaborator[];
  onPress?: () => void;
  max?: number;
  size?: number;
}

/**
 * Stacked (overlapping) avatars to indicate collaborators of a diary.
 * Used in the diary detail header.
 */
export function CollaboratorAvatarStack({
  collaborators,
  onPress,
  max = 3,
  size = 22,
}: CollaboratorAvatarStackProps) {
  if (collaborators.length === 0) return null;

  const shown = collaborators.slice(0, max);
  const remaining = collaborators.length - shown.length;

  const Wrapper: React.ComponentType<{ children: React.ReactNode }> = onPress
    ? ({ children }) => (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} hitSlop={8}>
          {children}
        </TouchableOpacity>
      )
    : ({ children }) => <View>{children}</View>;

  return (
    <Wrapper>
      <View style={styles.stack}>
        {shown.map((c, idx) => {
          const avatar = c.profile?.avatar_url;
          const name = c.profile?.display_name || c.profile?.username || '?';
          const initial = name.charAt(0).toUpperCase();
          return (
            <View
              key={c.id}
              style={[
                styles.avatarWrap,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  marginLeft: idx === 0 ? 0 : -size / 3,
                  zIndex: max - idx,
                },
              ]}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.fallback, { borderRadius: size / 2 }]}>
                  <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{initial}</Text>
                </View>
              )}
            </View>
          );
        })}
        {remaining > 0 && (
          <View
            style={[
              styles.avatarWrap,
              styles.moreWrap,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                marginLeft: -size / 3,
              },
            ]}
          >
            <Text style={[styles.moreText, { fontSize: size * 0.38 }]}>+{remaining}</Text>
          </View>
        )}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
    backgroundColor: '#ccc',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(200,90,66,0.6)',
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
  },
  moreWrap: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: '#fff',
    fontWeight: '700',
  },
});
