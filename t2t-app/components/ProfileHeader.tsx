import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <View style={styles.container}>
      {/* Avatar + stats row */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={diaryCount} label={t('profile.diaries')} />
          <View style={styles.statDivider} />
          <StatBox value={stats?.followers || 0} label={t('profile.followers')} />
          <View style={styles.statDivider} />
          <StatBox value={stats?.following || 0} label={t('profile.following')} />
        </View>
      </View>

      {/* Name + username + bio */}
      <View style={styles.infoSection}>
        <Text style={styles.displayName}>{displayName}</Text>
        {username ? <Text style={styles.username}>@{username}</Text> : null}
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {profile?.travel_style ? (
          <View style={styles.stylePill}>
            <Ionicons name="airplane-outline" size={12} color="#e65100" />
            <Text style={styles.styleText}>{profile.travel_style}</Text>
          </View>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.editBtn} onPress={onEditPress} activeOpacity={0.75}>
            <Ionicons name="pencil" size={15} color="#1a1a1a" />
            <Text style={styles.editBtnText}>{t('profile.edit_profile')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={onFollowToggle}
              activeOpacity={0.8}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? t('profile.following_button') : t('profile.follow')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={t('social.share_profile')}
              activeOpacity={0.75}
            >
              <Ionicons name="share-outline" size={18} color="#1a1a1a" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statNumber}>{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
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
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
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
    width: 1,
    height: 28,
    backgroundColor: '#f0f0f0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
    marginTop: 8,
  },
  stylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
    gap: 4,
  },
  styleText: {
    fontSize: 12,
    color: '#e65100',
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
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    backgroundColor: '#fff',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  followBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  followingBtn: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  followingBtnText: {
    color: '#1a1a1a',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
