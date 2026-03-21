import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image, Share, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '@/components/ProfileHeader';
import { BadgesSection } from '@/components/BadgesSection';
import { TravelStats } from '@/components/TravelStats';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNotifications } from '@/hooks/useNotifications';
import i18n from '@/i18n';
import type { Diary, FeedDiary } from '@/types/supabase';

const BIO_MAX = 160;

type DiaryTab = 'mine' | 'saved';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar, checkUsernameUnique } = useUserProfile(user?.id);
  const { unreadCount } = useNotifications();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [savedDiaries, setSavedDiaries] = useState<FeedDiary[]>([]);
  const [diaryTab, setDiaryTab] = useState<DiaryTab>('mine');
  const langSynced = useRef(false);

  useEffect(() => {
    if (profile?.preferred_language && !langSynced.current) {
      langSynced.current = true;
      i18n.changeLanguage(profile.preferred_language);
    }
  }, [profile?.preferred_language]);
  const [loadingDiaries, setLoadingDiaries] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Edit State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', username: '', bio: '' });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

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

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    setLoadingSaved(true);
    const { data, error } = await supabase
      .from('saves')
      .select(`
        diary_id,
        diaries!inner (
          *,
          profiles!diaries_author_id_fkey (
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      const mapped = data
        .map((row: any) => row.diaries)
        .filter(Boolean) as FeedDiary[];
      setSavedDiaries(mapped);
    }
    setLoadingSaved(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchDiaries();
        fetchSaved();
      }
    }, [user, fetchDiaries, fetchSaved])
  );

  const handleEditPress = () => {
    setEditForm({
      display_name: profile?.display_name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
    });
    setUsernameError(null);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) {
      setUsernameError(t('profile.username_required'));
      return;
    }

    if (editForm.username !== profile?.username) {
      const isUnique = await checkUsernameUnique(editForm.username);
      if (!isUnique) {
        setUsernameError(t('profile.username_taken'));
        return;
      }
    }

    setUsernameError(null);
    const { success } = await updateProfile(editForm);
    if (success) setIsEditModalVisible(false);
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

  const isLoadingSection = diaryTab === 'mine' ? loadingDiaries : loadingSaved;
  const activeDiaries = diaryTab === 'mine' ? diaries : savedDiaries;

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
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/(app)/settings')}>
            <Ionicons name="settings-outline" size={24} color="#1a1a1a" />
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

        {/* Section: Travel Stats */}
        <TravelStats diaries={diaries} />

        {/* Section: Badges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('badges.title')}</Text>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <BadgesSection
            stats={{
              diaries: (profile?.stats as any)?.diaries ?? diaries.length,
              countries: (profile?.stats as any)?.countries ?? 0,
              followers: (profile?.stats as any)?.followers ?? 0,
              totalLikes: diaries.reduce((sum, d) => sum + (d.like_count || 0), 0),
            }}
            isOwnProfile
          />
        </View>

        {/* Diary Tabs */}
        <View style={styles.diaryTabsRow}>
          <TouchableOpacity
            style={[styles.diaryTabBtn, diaryTab === 'mine' && styles.diaryTabBtnActive]}
            onPress={() => setDiaryTab('mine')}
          >
            <Ionicons
              name="journal-outline"
              size={15}
              color={diaryTab === 'mine' ? '#007AFF' : '#999'}
            />
            <Text style={[styles.diaryTabText, diaryTab === 'mine' && styles.diaryTabTextActive]}>
              {t('profile.my_diaries')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.diaryTabBtn, diaryTab === 'saved' && styles.diaryTabBtnActive]}
            onPress={() => setDiaryTab('saved')}
          >
            <Ionicons
              name="bookmark-outline"
              size={15}
              color={diaryTab === 'saved' ? '#007AFF' : '#999'}
            />
            <Text style={[styles.diaryTabText, diaryTab === 'saved' && styles.diaryTabTextActive]}>
              {t('profile.saved_diaries')}
            </Text>
          </TouchableOpacity>
          {diaryTab === 'mine' && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(app)/(tabs)/create')}
            >
              <Ionicons name="add-circle" size={28} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {isLoadingSection ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
        ) : activeDiaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={diaryTab === 'mine' ? 'journal-outline' : 'bookmark-outline'}
              size={48}
              color="#ccc"
            />
            <Text style={styles.emptyText}>
              {diaryTab === 'mine' ? t('profile.no_diaries') : t('profile.no_saved')}
            </Text>
            {diaryTab === 'mine' && (
              <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(app)/(tabs)/create')}>
                <Text style={styles.createBtnText}>{t('profile.create_first')}</Text>
              </TouchableOpacity>
            )}
            {diaryTab === 'saved' && (
              <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(app)/(tabs)/explore')}>
                <Text style={styles.createBtnText}>{t('profile.explore_diaries')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.diariesList}>
            {(activeDiaries as (Diary | FeedDiary)[]).map((diary) => {
              const isFeed = diaryTab === 'saved';
              const authorProfile = isFeed ? (diary as FeedDiary).profiles : null;
              return (
                <TouchableOpacity
                  key={diary.id}
                  style={styles.diaryCard}
                  onPress={() => router.push(`/diary/${diary.id}`)}
                >
                  <View style={styles.diaryCardContent}>
                    <Text style={styles.diaryTitle} numberOfLines={1}>{diary.title}</Text>
                    {isFeed && authorProfile && (
                      <Text style={styles.diaryAuthor} numberOfLines={1}>
                        @{authorProfile.username || authorProfile.display_name}
                      </Text>
                    )}
                    {diary.destinations && diary.destinations.length > 0 && (
                      <Text style={styles.diaryDest} numberOfLines={1}>
                        📍 {diary.destinations.join(', ')}
                      </Text>
                    )}
                    <View style={styles.diaryMeta}>
                      {diaryTab === 'mine' && (
                        <View style={[styles.statusBadge, diary.status === 'published' && styles.statusPublished]}>
                          <Text style={[styles.statusText, diary.status === 'published' && styles.statusTextPublished]}>
                            {diary.status === 'draft' ? `📝 ${t('profile.status_draft')}` : `🌍 ${t('profile.status_published')}`}
                          </Text>
                        </View>
                      )}
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
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('profile.edit_profile')}</Text>
            <TouchableOpacity
              style={[styles.modalSaveBtn, profileLoading && { opacity: 0.5 }]}
              onPress={handleSaveProfile}
              disabled={profileLoading}
            >
              {profileLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.modalSaveBtnText}>{t('common.save')}</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarEdit} onPress={handlePickAvatar} activeOpacity={0.8}>
              <View style={styles.avatarLargeRing}>
                <View style={styles.avatarLarge}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={40} color="#fff" />
                  )}
                </View>
              </View>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
              <Text style={styles.changeAvatarText}>{t('profile.change_avatar')}</Text>
            </TouchableOpacity>

            {/* Display Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.display_name')}</Text>
              <TextInput
                style={[styles.input, focusedField === 'display_name' && styles.inputFocused]}
                value={editForm.display_name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, display_name: text }))}
                placeholder={t('profile.display_name')}
                placeholderTextColor="#bbb"
                returnKeyType="next"
                onFocus={() => setFocusedField('display_name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.username')}</Text>
              <View style={[styles.inputWithPrefix, focusedField === 'username' && styles.inputFocused, usernameError ? styles.inputError : null]}>
                <Text style={styles.inputPrefix}>@</Text>
                <TextInput
                  style={styles.inputInline}
                  value={editForm.username}
                  onChangeText={(text) => {
                    setUsernameError(null);
                    setEditForm(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9_]/g, '') }));
                  }}
                  placeholder={t('profile.username_placeholder')}
                  placeholderTextColor="#bbb"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {usernameError && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={13} color="#FF3B30" />
                  <Text style={styles.errorText}>{usernameError}</Text>
                </View>
              )}
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('profile.bio')}</Text>
                <Text style={[styles.charCount, editForm.bio.length > BIO_MAX && styles.charCountOver]}>
                  {editForm.bio.length}/{BIO_MAX}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea, focusedField === 'bio' && styles.inputFocused]}
                value={editForm.bio}
                onChangeText={(text) => {
                  if (text.length <= BIO_MAX) setEditForm(prev => ({ ...prev, bio: text }));
                }}
                placeholder={t('profile.bio_placeholder')}
                placeholderTextColor="#bbb"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Save button in body */}
            <TouchableOpacity
              style={[styles.saveBodyBtn, profileLoading && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={profileLoading}
              activeOpacity={0.8}
            >
              {profileLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBodyBtnText}>{t('common.save')}</Text>
              }
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
              <Text style={styles.logoutText}>{t('common.logout')}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  diaryTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
  },
  diaryTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
  },
  diaryTabBtnActive: {
    backgroundColor: '#e8f0fe',
  },
  diaryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  diaryTabTextActive: {
    color: '#007AFF',
  },
  addBtn: {
    marginLeft: 'auto',
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
    marginBottom: 2,
  },
  diaryAuthor: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalSaveBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  avatarEdit: {
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  avatarLargeRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: '#007AFF',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 22,
    right: '50%',
    transform: [{ translateX: 28 }],
    backgroundColor: '#007AFF',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changeAvatarText: {
    marginTop: 10,
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  charCount: {
    fontSize: 12,
    color: '#bbb',
    fontWeight: '500',
  },
  charCountOver: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  inputFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#fafafa',
  },
  inputPrefix: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
    marginRight: 2,
  },
  inputInline: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    padding: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  saveBodyBtn: {
    backgroundColor: '#007AFF',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  saveBodyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  logoutText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
