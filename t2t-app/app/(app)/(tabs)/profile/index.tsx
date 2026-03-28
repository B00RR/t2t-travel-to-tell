import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image, Share, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { DiaryCardSkeleton } from '@/components/Skeleton';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PassportCard } from '@/components/PassportCard';
import { JourneyMap } from '@/components/JourneyMap';
import { BadgesSection } from '@/components/BadgesSection';
import { TravelStats } from '@/components/TravelStats';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography } from '@/constants/theme';
import i18n from '@/i18n';
import type { Diary, FeedDiary } from '@/types/supabase';
import { normalizeProfile } from '@/types/supabase';

const BIO_MAX = 160;

type DiaryTab = 'mine' | 'saved';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
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
    const message = `${name}${bio}\n\nFollow me on T2T — Travel to Tell`;
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('profile.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleShareProfile}>
            <Ionicons name="share-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => router.push('/(app)/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.textSecondary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.red, borderColor: theme.bg }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/(app)/settings')}>
            <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Passport Card */}
        <PassportCard
          displayName={profile?.display_name || null}
          username={profile?.username || null}
          avatarUrl={profile?.avatar_url || null}
          bio={profile?.bio || null}
          travelStyle={profile?.travel_style || null}
          memberSince={profile?.created_at || new Date().toISOString()}
          countries={Array.from(new Set(
            diaries
              .filter(d => d.status === 'published')
              .flatMap(d => d.destinations || [])
          ))}
          stats={{
            diaries: diaries.length,
            followers: (profile?.stats as any)?.followers ?? 0,
            following: (profile?.stats as any)?.following ?? 0,
          }}
          isOwnProfile={true}
          onEditPress={handleEditPress}
          onSharePress={handleShareProfile}
        />

        {/* Journey Map */}
        {user?.id && <JourneyMap userId={user.id} />}

        {/* Travel Stats */}
        <TravelStats diaries={diaries} />

        {/* Badges */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('badges.title')}</Text>
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
            style={[
              styles.diaryTabBtn,
              { backgroundColor: theme.bgElevated, borderColor: theme.border },
              diaryTab === 'mine' && { backgroundColor: theme.tealAlpha15, borderColor: theme.teal },
            ]}
            onPress={() => setDiaryTab('mine')}
          >
            <Ionicons
              name="journal-outline"
              size={15}
              color={diaryTab === 'mine' ? theme.teal : theme.textMuted}
            />
            <Text style={[
              styles.diaryTabText,
              { color: theme.textMuted },
              diaryTab === 'mine' && { color: theme.teal },
            ]}>
              {t('profile.my_diaries')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.diaryTabBtn,
              { backgroundColor: theme.bgElevated, borderColor: theme.border },
              diaryTab === 'saved' && { backgroundColor: theme.tealAlpha15, borderColor: theme.teal },
            ]}
            onPress={() => setDiaryTab('saved')}
          >
            <Ionicons
              name="bookmark-outline"
              size={15}
              color={diaryTab === 'saved' ? theme.teal : theme.textMuted}
            />
            <Text style={[
              styles.diaryTabText,
              { color: theme.textMuted },
              diaryTab === 'saved' && { color: theme.teal },
            ]}>
              {t('profile.saved_diaries')}
            </Text>
          </TouchableOpacity>
          {diaryTab === 'mine' && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(app)/(tabs)/create')}
            >
              <Ionicons name="add-circle" size={28} color={theme.teal} />
            </TouchableOpacity>
          )}
        </View>

        {isLoadingSection ? (
          <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
            <DiaryCardSkeleton />
            <DiaryCardSkeleton />
          </View>
        ) : activeDiaries.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Ionicons
              name={diaryTab === 'mine' ? 'journal-outline' : 'bookmark-outline'}
              size={48}
              color={theme.border}
            />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {diaryTab === 'mine' ? t('profile.no_diaries') : t('profile.no_saved')}
            </Text>
            {diaryTab === 'mine' && (
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: theme.teal }]}
                onPress={() => router.push('/(app)/(tabs)/create')}
              >
                <Text style={styles.createBtnText}>{t('profile.create_first')}</Text>
              </TouchableOpacity>
            )}
            {diaryTab === 'saved' && (
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: theme.teal }]}
                onPress={() => router.push('/(app)/(tabs)/explore')}
              >
                <Text style={styles.createBtnText}>{t('profile.explore_diaries')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.diariesGrid}>
            {(activeDiaries as (Diary | FeedDiary)[]).map((diary) => {
              const isFeed = diaryTab === 'saved';
              const authorProfile = isFeed ? normalizeProfile((diary as FeedDiary).profiles) : null;
              const hasCover = !!diary.cover_image_url;
              return (
                <TouchableOpacity
                  key={diary.id}
                  style={[styles.diaryGridCardShadow, { backgroundColor: theme.bgSurface }]}
                  onPress={() => router.push(`/diary/${diary.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.diaryGridCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                    <View style={[styles.diaryGridCover, { backgroundColor: theme.bgElevated }]}>
                      {hasCover ? (
                        <Image source={{ uri: diary.cover_image_url! }} style={styles.diaryGridCoverImg} />
                      ) : (
                        <View style={[styles.diaryGridCoverPlaceholder, { backgroundColor: theme.bgElevated }]}>
                          <Ionicons name="image-outline" size={28} color={theme.textMuted} />
                        </View>
                      )}
                      {diaryTab === 'mine' && (
                        <View style={[
                          styles.gridStatusBadge,
                          { backgroundColor: theme.overlay },
                          diary.status === 'published' && { backgroundColor: theme.tealAlpha15 },
                        ]}>
                          <Text style={[
                            styles.gridStatusText,
                            { color: theme.textSecondary },
                            diary.status === 'published' && { color: theme.teal },
                          ]}>
                            {diary.status === 'draft' ? t('profile.status_draft') : t('profile.status_published')}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.diaryGridInfo}>
                      <Text style={[styles.diaryGridTitle, { color: theme.textPrimary }]} numberOfLines={2}>{diary.title}</Text>
                      {isFeed && authorProfile && (
                        <Text style={[styles.diaryGridAuthor, { color: theme.teal }]} numberOfLines={1}>
                          @{authorProfile.username || authorProfile.display_name}
                        </Text>
                      )}
                      {diary.destinations && diary.destinations.length > 0 && (
                        <Text style={[styles.diaryGridDest, { color: theme.textMuted }]} numberOfLines={1}>
                          {diary.destinations[0]}{diary.destinations.length > 1 ? ` +${diary.destinations.length - 1}` : ''}
                        </Text>
                      )}
                      <View style={styles.diaryGridStats}>
                        <Ionicons name="heart" size={12} color={theme.textMuted} />
                        <Text style={[styles.diaryGridStatNum, { color: theme.textMuted }]}>{diary.like_count || 0}</Text>
                        <Ionicons name="eye" size={12} color={theme.textMuted} style={{ marginLeft: 6 }} />
                        <Text style={[styles.diaryGridStatNum, { color: theme.textMuted }]}>{diary.view_count || 0}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: theme.bgSurface }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('profile.edit_profile')}</Text>
            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: theme.teal }, profileLoading && { opacity: 0.5 }]}
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
              <View style={styles.avatarEditWrapper}>
                <View style={[styles.avatarLargeRing, { borderColor: theme.teal }]}>
                  <View style={[styles.avatarLarge, { backgroundColor: theme.bgElevated }]}>
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={40} color={theme.textMuted} />
                    )}
                  </View>
                </View>
                <View style={[styles.avatarEditBadge, { backgroundColor: theme.teal, borderColor: theme.bgSurface }]}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </View>
              <Text style={[styles.changeAvatarText, { color: theme.teal }]}>{t('profile.change_avatar')}</Text>
            </TouchableOpacity>

            {/* Display Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textMuted }]}>{t('profile.display_name')}</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary },
                  focusedField === 'display_name' && { borderColor: theme.teal },
                ]}
                value={editForm.display_name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, display_name: text }))}
                placeholder={t('profile.display_name')}
                placeholderTextColor={theme.textMuted}
                returnKeyType="next"
                onFocus={() => setFocusedField('display_name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textMuted }]}>{t('profile.username')}</Text>
              <View style={[
                styles.inputWithPrefix,
                { backgroundColor: theme.bgElevated, borderColor: theme.border },
                focusedField === 'username' && { borderColor: theme.teal },
                usernameError ? { borderColor: theme.red } : null,
              ]}>
                <Text style={[styles.inputPrefix, { color: theme.textSecondary }]}>@</Text>
                <TextInput
                  style={[styles.inputInline, { color: theme.textPrimary }]}
                  value={editForm.username}
                  onChangeText={(text) => {
                    setUsernameError(null);
                    setEditForm(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9_]/g, '') }));
                  }}
                  placeholder={t('profile.username_placeholder')}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {usernameError && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={13} color={theme.red} />
                  <Text style={[styles.errorText, { color: theme.red }]}>{usernameError}</Text>
                </View>
              )}
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.textMuted }]}>{t('profile.bio')}</Text>
                <Text style={[styles.charCount, { color: theme.textMuted }, editForm.bio.length > BIO_MAX && { color: theme.red }]}>
                  {editForm.bio.length}/{BIO_MAX}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input, styles.textArea,
                  { backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary },
                  focusedField === 'bio' && { borderColor: theme.teal },
                ]}
                value={editForm.bio}
                onChangeText={(text) => {
                  if (text.length <= BIO_MAX) setEditForm(prev => ({ ...prev, bio: text }));
                }}
                placeholder={t('profile.bio_placeholder')}
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBodyBtn, { backgroundColor: theme.teal }, profileLoading && { opacity: 0.6 }]}
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
            <TouchableOpacity style={[styles.logoutRow, { borderTopColor: theme.border }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={theme.red} />
              <Text style={[styles.logoutText, { color: theme.red }]}>{t('common.logout')}</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h1,
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
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h2,
  },
  diaryTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  diaryTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  diaryTabText: {
    ...Typography.label,
  },
  addBtn: {
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  createBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  createBtnText: {
    color: '#fff',
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
    borderRadius: Radius.sm,
  },
  diaryGridCard: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
  },
  diaryGridCover: {
    height: 120,
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
  },
  gridStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  gridStatusText: {
    ...Typography.micro,
  },
  diaryGridInfo: {
    padding: 10,
  },
  diaryGridTitle: {
    ...Typography.caption,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  diaryGridAuthor: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  diaryGridDest: {
    fontSize: 11,
    marginBottom: 6,
  },
  diaryGridStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diaryGridStatNum: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h3,
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    minWidth: 64,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#fff',
    ...Typography.label,
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
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  changeAvatarText: {
    marginTop: 10,
    ...Typography.caption,
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
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  charCount: {
    ...Typography.caption,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 2,
  },
  inputInline: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    ...Typography.caption,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  saveBodyBtn: {
    height: 52,
    borderRadius: Radius.sm,
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
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
