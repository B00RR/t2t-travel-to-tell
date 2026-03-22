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
import { Palette } from '@/constants/theme';

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
            <Ionicons name="share-outline" size={24} color={Palette.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => router.push('/(app)/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={Palette.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/(app)/settings')}>
            <Ionicons name="settings-outline" size={24} color={Palette.textSecondary} />
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
              diaries: diaries.filter(d => d.status === 'published').length,
              countries: new Set(
                diaries
                  .filter(d => d.status === 'published')
                  .flatMap(d => d.destinations || [])
              ).size,
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
              color={diaryTab === 'mine' ? Palette.teal : Palette.textMuted}
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
              color={diaryTab === 'saved' ? Palette.teal : Palette.textMuted}
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
              <Ionicons name="add-circle" size={28} color={Palette.teal} />
            </TouchableOpacity>
          )}
        </View>

        {isLoadingSection ? (
          <ActivityIndicator size="large" color={Palette.teal} style={{ marginTop: 32 }} />
        ) : activeDiaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={diaryTab === 'mine' ? 'journal-outline' : 'bookmark-outline'}
              size={48}
              color={Palette.border}
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
          <View style={styles.diariesGrid}>
            {(activeDiaries as (Diary | FeedDiary)[]).map((diary) => {
              const isFeed = diaryTab === 'saved';
              const authorProfile = isFeed ? (diary as FeedDiary).profiles : null;
              const hasCover = !!diary.cover_image_url;
              return (
                <TouchableOpacity
                  key={diary.id}
                  style={styles.diaryGridCardShadow}
                  onPress={() => router.push(`/diary/${diary.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.diaryGridCard}>
                  {/* Cover image or placeholder */}
                  <View style={styles.diaryGridCover}>
                    {hasCover ? (
                      <Image source={{ uri: diary.cover_image_url! }} style={styles.diaryGridCoverImg} />
                    ) : (
                      <View style={styles.diaryGridCoverPlaceholder}>
                        <Ionicons name="image-outline" size={28} color={Palette.textMuted} />
                      </View>
                    )}
                    {diaryTab === 'mine' && (
                      <View style={[styles.gridStatusBadge, diary.status === 'published' && styles.gridStatusPublished]}>
                        <Text style={[styles.gridStatusText, diary.status === 'published' && styles.gridStatusTextPublished]}>
                          {diary.status === 'draft' ? t('profile.status_draft') : t('profile.status_published')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Info below cover */}
                  <View style={styles.diaryGridInfo}>
                    <Text style={styles.diaryGridTitle} numberOfLines={2}>{diary.title}</Text>
                    {isFeed && authorProfile && (
                      <Text style={styles.diaryGridAuthor} numberOfLines={1}>
                        @{authorProfile.username || authorProfile.display_name}
                      </Text>
                    )}
                    {diary.destinations && diary.destinations.length > 0 && (
                      <Text style={styles.diaryGridDest} numberOfLines={1}>
                        📍 {diary.destinations[0]}{diary.destinations.length > 1 ? ` +${diary.destinations.length - 1}` : ''}
                      </Text>
                    )}
                    <View style={styles.diaryGridStats}>
                      <Ionicons name="heart" size={12} color={Palette.textMuted} />
                      <Text style={styles.diaryGridStatNum}>{diary.like_count || 0}</Text>
                      <Ionicons name="eye" size={12} color={Palette.textMuted} style={{ marginLeft: 6 }} />
                      <Text style={styles.diaryGridStatNum}>{diary.view_count || 0}</Text>
                    </View>
                  </View>
                  </View>
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
              <Ionicons name="close" size={24} color={Palette.textSecondary} />
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
              {/* Wrapper a dimensione fissa: il badge assoluto è relativo a questo */}
              <View style={styles.avatarEditWrapper}>
                <View style={styles.avatarLargeRing}>
                  <View style={styles.avatarLarge}>
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={40} color={Palette.bgPrimary} />
                    )}
                  </View>
                </View>
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
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
                  <Ionicons name="alert-circle" size={13} color={Palette.red} />
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
              <Ionicons name="log-out-outline" size={18} color={Palette.red} />
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
    backgroundColor: Palette.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Palette.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.textPrimary,
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
    backgroundColor: Palette.red,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Palette.bgPrimary,
  },
  badgeText: {
    color: Palette.textPrimary,
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
    color: Palette.textPrimary,
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
    backgroundColor: Palette.bgElevated,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  diaryTabBtnActive: {
    backgroundColor: Palette.tealDim,
    borderColor: Palette.teal,
  },
  diaryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  diaryTabTextActive: {
    color: Palette.teal,
  },
  addBtn: {
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 16,
    backgroundColor: Palette.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyText: {
    fontSize: 15,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: Palette.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: Palette.bgPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  diariesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  diaryGridCardShadow: {
    width: '47.5%',
    borderRadius: 14,
    backgroundColor: Palette.bgSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  diaryGridCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Palette.bgSurface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  diaryGridCover: {
    height: 120,
    backgroundColor: Palette.bgElevated,
    position: 'relative',
  },
  diaryGridCoverImg: {
    width: '100%',
    height: '100%',
  },
  diaryGridCoverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.bgElevated,
  },
  gridStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Palette.overlayMid,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gridStatusPublished: {
    backgroundColor: 'rgba(0,201,167,0.18)',
  },
  gridStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  gridStatusTextPublished: {
    color: Palette.teal,
  },
  diaryGridInfo: {
    padding: 10,
  },
  diaryGridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  diaryGridAuthor: {
    fontSize: 11,
    color: Palette.teal,
    fontWeight: '600',
    marginBottom: 3,
  },
  diaryGridDest: {
    fontSize: 11,
    color: Palette.textMuted,
    marginBottom: 6,
  },
  diaryGridStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diaryGridStatNum: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '600',
    marginLeft: 2,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Palette.bgSurface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  modalSaveBtn: {
    backgroundColor: Palette.teal,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: Palette.bgPrimary,
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
  },
  avatarEditWrapper: {
    width: 96,
    height: 96,
    position: 'relative',
  },
  avatarLargeRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: Palette.teal,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  avatarLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Palette.tealDim,
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
    bottom: 2,
    right: 2,
    backgroundColor: Palette.teal,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Palette.bgSurface,
  },
  changeAvatarText: {
    marginTop: 10,
    color: Palette.teal,
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
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  charCount: {
    fontSize: 12,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  charCountOver: {
    color: Palette.red,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: Palette.textPrimary,
    backgroundColor: Palette.bgElevated,
  },
  inputFocused: {
    borderColor: Palette.teal,
    backgroundColor: Palette.bgElevated,
  },
  inputError: {
    borderColor: Palette.red,
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Palette.bgElevated,
  },
  inputPrefix: {
    fontSize: 16,
    color: Palette.textSecondary,
    fontWeight: '600',
    marginRight: 2,
  },
  inputInline: {
    flex: 1,
    fontSize: 16,
    color: Palette.textPrimary,
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
    color: Palette.red,
    fontWeight: '500',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  saveBodyBtn: {
    backgroundColor: Palette.teal,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBodyBtnText: {
    color: Palette.bgPrimary,
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
    borderTopColor: Palette.border,
  },
  logoutText: {
    fontSize: 15,
    color: Palette.red,
    fontWeight: '600',
  },
});
