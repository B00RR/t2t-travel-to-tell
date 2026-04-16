import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/hooks/useAuth';
import { useDiaryCollaborators } from '@/hooks/useDiaryCollaborators';
import { useDiaryPermissions } from '@/hooks/useDiaryPermissions';
import { CollaboratorListItem } from '@/components/CollaboratorListItem';
import { InviteCollaboratorModal } from '@/components/InviteCollaboratorModal';
import { Radius, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_COLLABORATORS = 10;

export default function CollaboratorsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const diaryId = Array.isArray(params.id) ? params.id[0] : params.id;

  const permissions = useDiaryPermissions(diaryId as string | undefined);
  const {
    collaborators,
    pending,
    loading,
    refresh,
    inviteCollaborator,
    removeCollaborator,
  } = useDiaryCollaborators(diaryId as string | undefined);

  const [showInvite, setShowInvite] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleRemove = useCallback(
    async (collabId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await removeCollaborator(collabId);
    },
    [removeCollaborator],
  );

  const excluded = [
    ...collaborators.map(c => c.user_id),
    ...pending.map(c => c.user_id),
    ...(user?.id ? [user.id] : []),
  ];

  const totalActive = collaborators.length + pending.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.bgSurface, borderBottomColor: theme.border, paddingTop: insets.top },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        >
          <Ionicons name="arrow-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t('collab.manage')}
          </Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>
            {t('collab.count', { current: totalActive, max: MAX_COLLABORATORS })}
          </Text>
        </View>
        {permissions.canInvite ? (
          <TouchableOpacity
            onPress={() => setShowInvite(true)}
            style={[styles.headerBtn, styles.inviteBtn, { backgroundColor: theme.teal }]}
            accessibilityRole="button"
            accessibilityLabel={t('collab.invite')}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {loading && collaborators.length === 0 && pending.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.teal} />
          }
        >
          {collaborators.length === 0 && pending.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={56} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {t('collab.empty')}
              </Text>
            </View>
          ) : (
            <>
              {collaborators.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                    {t('collab.accepted_section', { count: collaborators.length })}
                  </Text>
                  {collaborators.map(c => (
                    <CollaboratorListItem
                      key={c.id}
                      collaborator={c}
                      canRemove={permissions.canInvite}
                      onRemove={handleRemove}
                    />
                  ))}
                </View>
              )}

              {pending.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                    {t('collab.pending_section', { count: pending.length })}
                  </Text>
                  {pending.map(c => (
                    <CollaboratorListItem
                      key={c.id}
                      collaborator={c}
                      canRemove={permissions.canInvite}
                      onRemove={handleRemove}
                      isPending
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <InviteCollaboratorModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={inviteCollaborator}
        excludedUserIds={excluded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtn: {
    borderRadius: Radius.full,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
