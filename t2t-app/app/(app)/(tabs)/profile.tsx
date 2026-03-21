import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '@/components/ProfileHeader';
import { BadgesSection } from '@/components/BadgesSection';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNotifications } from '@/hooks/useNotifications';
import type { Diary } from '@/types/supabase';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar, checkUsernameUnique } = useUserProfile(user?.id);
  const { unreadCount } = useNotifications();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loadingDiaries, setLoadingDiaries] = useState(true);

  // Edit State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: '',
  });

  const fetchDiaries = useCallback(async () => {
    if (!user) return;
    setLoadingDiaries(true);
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setDiaries(data);
    setLoadingDiaries(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchDiaries();
      }
    }, [user, fetchDiaries])
  );

  const handleEditPress = () => {
    setEditForm({
      display_name: profile?.display_name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
    });
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) {
      Alert.alert(t('common.error'), t('profile.username_required'));
      return;
    }

    // Check username uniqueness if changed
    if (editForm.username !== profile?.username) {
      const isUnique = await checkUsernameUnique(editForm.username);
      if (!isUnique) {
        Alert.alert(t('common.error'), t('profile.username_taken'));
        return;
      }
    }

    const { success } = await updateProfile(editForm);
    if (success) {
      setIsEditModalVisible(false);
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  async function handleShareProfile() {
    if (!profile) return;
    const name = profile.display_name || profile.username || 'Un viaggiatore';
    const bio = profile.bio ? `\n"${profile.bio}"` : '';
    const message = `👤 ${name}${bio}\n\n🌍 Seguimi su T2T — Travel to Tell`;
    try {
      await Share.share({ message, title: name });
    } catch (_) {}
  }

  function handleLogout() {
    Alert.alert(
      t('common.logout'),
      t('common.logout_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), style: 'destructive', onPress: () => supabase.auth.signOut() },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleShareProfile}>
            <Ionicons name="share-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => router.push('/(app)/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          profile={profile}
          diaryCount={diaries.length}
          isOwnProfile={true}
          onEditPress={handleEditPress}
        />

        {/* Section: Badges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('badges.title')}</Text>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <BadgesSection
            stats={{
              diaries: profile?.stats?.diaries ?? diaries.length,
              countries: profile?.stats?.countries ?? 0,
              followers: profile?.stats?.followers ?? 0,
              totalLikes: diaries.reduce((sum, d) => sum + (d.like_count || 0), 0),
            }}
            isOwnProfile
          />
        </View>

        {/* Section: My Diaries */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.my_diaries')}</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/create')}>
            <Ionicons name="add-circle" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {loadingDiaries ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
        ) : diaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="journal-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{t('profile.no_diaries')}</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(app)/(tabs)/create')}>
              <Text style={styles.createBtnText}>{t('profile.create_first')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.diariesList}>
            {diaries.map((diary) => (
              <TouchableOpacity
                key={diary.id}
                style={styles.diaryCard}
                onPress={() => router.push(`/diary/${diary.id}`)}
              >
                <View style={styles.diaryCardContent}>
                  <Text style={styles.diaryTitle} numberOfLines={1}>{diary.title}</Text>
                  {diary.destinations && diary.destinations.length > 0 && (
                    <Text style={styles.diaryDest} numberOfLines={1}>
                      📍 {diary.destinations.join(', ')}
                    </Text>
                  )}
                  <View style={styles.diaryMeta}>
                    <View style={[styles.statusBadge, diary.status === 'published' && styles.statusPublished]}>
                      <Text style={[styles.statusText, diary.status === 'published' && styles.statusTextPublished]}>
                        {diary.status === 'draft' ? `📝 ${t('profile.status_draft')}` : `🌍 ${t('profile.status_published')}`}
                      </Text>
                    </View>
                    <View style={styles.diaryStats}>
                      <Ionicons name="heart" size={14} color="#ccc" />
                      <Text style={styles.diaryStatNum}>{diary.like_count || 0}</Text>
                      <Ionicons name="eye" size={14} color="#ccc" style={{ marginLeft: 8 }} />
                      <Text style={styles.diaryStatNum}>{diary.view_count || 0}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.modalCancel}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('profile.edit_profile')}</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={profileLoading}>
              <Text style={[styles.modalSave, profileLoading && { opacity: 0.5 }]}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Avatar Edit */}
            <TouchableOpacity style={styles.avatarEdit} onPress={handlePickAvatar}>
              <View style={styles.avatarLarge}>
                 {profile?.avatar_url ? (
                   <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                 ) : (
                   <Ionicons name="person" size={40} color="#fff" />
                 )}
                 <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={16} color="#fff" />
                 </View>
              </View>
              <Text style={styles.changeAvatarText}>{t('profile.change_avatar')}</Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.display_name')}</Text>
              <TextInput
                style={styles.input}
                value={editForm.display_name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, display_name: text }))}
                placeholder={t('profile.display_name')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.username')}</Text>
              <TextInput
                style={styles.input}
                value={editForm.username}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder={t('profile.username')}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.bio')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.bio}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                placeholder={t('profile.bio_placeholder')}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  headerIcon: {
    padding: 4,
    position: 'relative',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },

  // Profile Card (These styles are now mostly handled by ProfileHeader, but some might be reused or overridden)
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  username: {
    fontSize: 15,
    color: '#999',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  travelStylePill: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  travelStyleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e65100',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f0f0f0',
  },

  // My Diaries
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  diariesList: {
    marginHorizontal: 16,
  },
  diaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  diaryCardContent: {
    flex: 1,
    marginRight: 12,
  },
  diaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  diaryDest: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  diaryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPublished: {
    backgroundColor: '#e8faf0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusTextPublished: {
    color: '#34C759',
  },
  diaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  diaryStatNum: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '600',
  },
});
