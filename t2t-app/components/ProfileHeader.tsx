import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Profile } from '@/types/supabase';

interface ProfileHeaderProps {
  profile: Profile | null;
  diaryCount: number;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  onEditPress?: () => void;
}

export function ProfileHeader({
  profile,
  diaryCount,
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  onEditPress,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const displayName = profile?.display_name || profile?.username || t('common.anonymous');
  const username = profile?.username || '';
  const stats = profile?.stats as { countries?: number; followers?: number; following?: number } | null;

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgSurface, borderBottomColor: theme.border }]}>
      {/* Avatar + stats */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarRing, { borderColor: theme.teal, shadowColor: theme.teal }]}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.teal }]}>
                <Text style={[styles.avatarInitials, { color: theme.bgSurface }]}>{initials}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={diaryCount} label={t('profile.diaries')} />
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <StatBox value={stats?.followers || 0} label={t('profile.followers')} />
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <StatBox value={stats?.following || 0} label={t('profile.following')} />
        </View>
      </View>

      {/* Name + username + bio */}
      <View style={styles.infoSection}>
        <Text style={[styles.displayName, { color: theme.textPrimary }]}>{displayName}</Text>
        {username ? <Text style={[styles.username, { color: theme.textMuted }]}>@{username}</Text> : null}
        {profile?.bio ? <Text style={[styles.bio, { color: theme.textSecondary }]}>{profile.bio}</Text> : null}
        {profile?.travel_style ? (
          <View style={[styles.stylePill, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
            <Ionicons name="airplane-outline" size={12} color={theme.orange} />
            <Text style={[styles.styleText, { color: theme.orange }]}>{profile.travel_style}</Text>
          </View>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <TouchableOpacity style={[styles.editBtn, { borderColor: theme.border, backgroundColor: theme.bgElevated }]} onPress={onEditPress} activeOpacity={0.75}>
            <Ionicons name="pencil" size={15} color={theme.textPrimary} />
            <Text style={[styles.editBtnText, { color: theme.textPrimary }]}>{t('profile.edit_profile')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.followBtn,
                { backgroundColor: theme.teal, shadowColor: theme.teal },
                isFollowing && [styles.followingBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]
              ]}
              onPress={onFollowToggle}
              activeOpacity={0.82}
            >
              <Text style={[
                styles.followBtnText,
                { color: theme.buttonText },
                isFollowing && [styles.followingBtnText, { color: theme.textPrimary }]
              ]}>
                {isFollowing ? t('profile.following_button') : t('profile.follow')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { borderColor: theme.border, backgroundColor: theme.bgElevated }]}
              accessibilityRole="button"
              accessibilityLabel={t('social.share_profile')}
              activeOpacity={0.75}
            >
              <Ionicons name="share-outline" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    marginRight: 20,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  stylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  styleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  followBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  followingBtn: {
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  followingBtnText: {
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
