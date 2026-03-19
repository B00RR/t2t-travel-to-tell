import React from 'react';
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
  const displayName = profile?.display_name || profile?.username || 'Utente';
  const username = profile?.username || '';
  const stats = profile?.stats as { countries?: number; followers?: number; following?: number } | null;

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarRow}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{diaryCount}</Text>
            <Text style={styles.statLabel}>Diari</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.followers || 0}</Text>
            <Text style={styles.statLabel}>Follower</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.following || 0}</Text>
            <Text style={styles.statLabel}>Seguiti</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.displayName}>{displayName}</Text>
        {username ? <Text style={styles.username}>@{username}</Text> : null}
        
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        
        {profile?.travel_style ? (
          <View style={styles.stylePill}>
            <Text style={styles.styleText}>✈️ {profile.travel_style}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
            <Text style={styles.editBtnText}>Modifica Profilo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.followBtn, isFollowing && styles.followingBtn]} 
            onPress={onFollowToggle}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Segui già' : 'Segui'}
            </Text>
          </TouchableOpacity>
        )}
        
        {!isOwnProfile && (
           <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={20} color="#1a1a1a" />
           </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 20,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  username: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginTop: 10,
  },
  stylePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
  },
  styleText: {
    fontSize: 12,
    color: '#e65100',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  followBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: '#f0f0f0',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  followingBtnText: {
    color: '#1a1a1a',
  },
  shareBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
