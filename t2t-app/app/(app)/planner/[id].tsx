import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions, Share,
  Modal, TextInput,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTripPlanDetail } from '@/hooks/useTripPlanDetail';
import { useCreateTripPlan } from '@/hooks/useCreateTripPlan';
import { useTripPlanCollaborators } from '@/hooks/useTripPlanCollaborators';
import { TripPlanStopItem } from '@/components/TripPlanStopItem';
import { ChecklistSection } from '@/components/ChecklistSection';
import { BudgetSection } from '@/components/BudgetSection';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { InviteCollaboratorModal } from '@/components/InviteCollaboratorModal';
import { TripPlanCollaboratorListItem } from '@/components/TripPlanCollaboratorListItem';
import type { TripPlan } from '@/types/tripPlan';
import { useAppTheme, type AppTheme } from '@/hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Visibility = TripPlan['visibility'];

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TripPlanDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, insets.top), [theme, insets.top]);

  const {
    plan, stops, checklist, loading, saving,
    fetchPlan, deletePlan, updatePlan, updateStop, deleteStop,
    toggleChecklistItem, addChecklistItem, deleteChecklistItem,
    addStop,
  } = useTripPlanDetail(id);

  const { creating, clonePlan } = useCreateTripPlan(user?.id);
  const isOwner = plan?.author_id === user?.id;
  const isCollaborator = !isOwner;

  const {
    collaborators,
    pending,
    loading: collabLoading,
    refresh: refreshCollab,
    inviteCollaborator,
    removeCollaborator,
    leaveCollaboration,
  } = useTripPlanCollaborators(isOwner || isCollaborator ? (id as string) : undefined);

  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', description: '', destinations: '',
    start_date: '', end_date: '', visibility: 'private' as Visibility,
  });

  const openEditModal = useCallback(() => {
    if (!plan) return;
    setEditForm({
      title: plan.title,
      description: plan.description || '',
      destinations: (plan.destinations || []).join(', '),
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      visibility: plan.visibility,
    });
    setEditVisible(true);
  }, [plan]);

  async function handleSaveMetadata() {
    if (!editForm.title.trim()) { toast.show({ message: t('planner.err_title_required'), type: 'error' }); return; }
    const destinations = editForm.destinations.split(',').map(d => d.trim()).filter(Boolean);
    await updatePlan({ title: editForm.title.trim(), description: editForm.description.trim() || null, destinations, start_date: editForm.start_date.trim() || null, end_date: editForm.end_date.trim() || null, visibility: editForm.visibility });
    setEditVisible(false);
  }

  const handleBudgetUpdate = useCallback((budget: object) => updatePlan({ budget_estimate: budget }), [updatePlan]);

  useFocusEffect(useCallback(() => { if (id) fetchPlan(); }, [id, fetchPlan]));

  async function handleDelete() {
    Alert.alert(t('planner.delete_confirm_title'), t('planner.delete_confirm_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('planner.delete_btn'), style: 'destructive', onPress: async () => { const ok = await deletePlan(); if (ok) router.replace('/(app)/(tabs)/explore/planner' as never); } },
    ]);
  }

  async function handleShare() {
    if (!plan) return;
    const deepLink = Linking.createURL(`planner/${plan.id}`);
    const dests = plan.destinations?.join(', ') || '';
    const lines: string[] = [];
    lines.push(`🗺️ ${plan.title}`);
    if (dests) lines.push(`📍 ${dests}`);
    if (plan.start_date) lines.push(`📅 ${plan.start_date}${plan.end_date ? ` → ${plan.end_date}` : ''}`);
    if (plan.description) lines.push(`\n${plan.description}`);
    if (stops.length > 0) {
      lines.push(`\n📌 ${t('planner.stops').toUpperCase()}:`);
      stops.forEach(s => {
        const parts = [t('diary.day_label', { number: s.day_number }), s.title, s.location_name].filter(Boolean).join(' — ');
        lines.push(`  ${parts}`);
      });
    }
    const budget = plan.budget_estimate as Record<string, any> | null;
    if (budget?.total) lines.push(`\n💰 Budget: ${budget.total} ${budget.currency || 'EUR'}`);
    lines.push(`\n🔗 ${deepLink}`);
    lines.push(`\n✈️ Pianifica su T2T — Travel to Tell`);
    try { await Share.share({ message: lines.join('\n'), title: plan.title }); } catch {}
  }

  async function handleClone() {
    if (!plan) return;
    const newId = await clonePlan(plan.id);
    if (newId) Alert.alert(t('planner.cloned'), '', [{ text: 'OK', onPress: () => router.replace(`/planner/${newId}`) }]);
  }

  async function handleAddStop() {
    const nextDay = stops.length > 0 ? Math.max(...stops.map(s => s.day_number)) + 1 : 1;
    await addStop({ day_number: nextDay, title: null, location_name: null, notes: null, sort_order: nextDay });
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.teal} /></View>;
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <Ionicons name="map-outline" size={48} color={theme.border} />
        <Text style={styles.errorText}>{t('planner.not_found')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{t('diary.go_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover — full bleed */}
        <TouchableOpacity activeOpacity={isOwner ? 0.85 : 1} onPress={() => isOwner && setShowCoverPicker(true)}>
          {plan.cover_image_url ? (
            <Image source={{ uri: plan.cover_image_url }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="map-outline" size={52} color={theme.border} />
              {isOwner && <Text style={styles.coverPlaceholderText}>{t('cover.add_cover')}</Text>}
            </View>
          )}
          {isOwner && plan.cover_image_url && (
            <View style={styles.coverEditBadge}><Ionicons name="camera" size={14} color="#fff" /></View>
          )}
        </TouchableOpacity>

        {/* Floating header */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.floatingBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
            {isOwner ? (
              <>
                <TouchableOpacity style={styles.floatingBtn} onPress={openEditModal}>
                  <Ionicons name="create-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.floatingBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color={theme.red} />
                </TouchableOpacity>
              </>
            ) : plan.visibility === 'public' ? (
              <TouchableOpacity style={styles.cloneHeaderBtn} onPress={handleClone} disabled={creating}>
                {creating ? <ActivityIndicator size="small" color={theme.teal} /> : (
                  <><Ionicons name="copy-outline" size={15} color={theme.teal} /><Text style={styles.cloneHeaderBtnText}>{t('planner.clone')}</Text></>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.padded}>
          <Text style={styles.title}>{plan.title}</Text>

          {plan.destinations && plan.destinations.length > 0 && (
            <View style={styles.pillRow}>
              {plan.destinations.map((dest, idx) => (
                <View key={idx} style={styles.pill}><Text style={styles.pillText}>📍 {dest}</Text></View>
              ))}
            </View>
          )}

          <View style={styles.metaRow}>
            {plan.start_date && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                <Text style={styles.metaText}>{plan.start_date}{plan.end_date ? ` → ${plan.end_date}` : ''}</Text>
              </View>
            )}
            {plan.clone_count > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="copy-outline" size={14} color={theme.textMuted} />
                <Text style={styles.metaText}>{t('planner.clone_count', { count: plan.clone_count })}</Text>
              </View>
            )}
          </View>

          {plan.description ? <Text style={styles.description}>{plan.description}</Text> : null}

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('collab.title')}</Text>
            {(isOwner || isCollaborator) && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowCollabModal(true)} disabled={collabLoading}>
                <Ionicons name="people-outline" size={16} color="#fff" />
                <Text style={styles.addBtnText}>{t('collab.manage')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {collabLoading ? (
            <ActivityIndicator size="small" color={theme.teal} />
          ) : collaborators.length > 0 || pending.length > 0 ? (
            <View style={styles.collabSection}>
              {pending.length > 0 && (
                <>
                  <Text style={[styles.collabLabel, { color: theme.textMuted }]}>
                    {t('collab.pending_section', { count: pending.length })}
                  </Text>
                  {pending.map(c => (
                    <TripPlanCollaboratorListItem
                      key={c.id}
                      collaborator={c}
                      canRemove={isOwner}
                      onRemove={removeCollaborator}
                      isPending
                    />
                  ))}
                </>
              )}
              {collaborators.length > 0 && (
                <>
                  <Text style={[styles.collabLabel, { color: theme.textMuted }]}>
                    {t('collab.accepted_section', { count: collaborators.length })}
                  </Text>
                  {collaborators.map(c => (
                    <TripPlanCollaboratorListItem
                      key={c.id}
                      collaborator={c}
                      canRemove={isOwner}
                      onRemove={removeCollaborator}
                    />
                  ))}
                </>
              )}
            </View>
          ) : (
            <Text style={[styles.emptyText, { marginBottom: 16 }]}>{t('collab.empty')}</Text>
          )}

          {isCollaborator && (
            <TouchableOpacity style={styles.leaveBtn} onPress={() => {
              Alert.alert(t('collab.plan_leave_confirm_title'), t('collab.plan_leave_confirm_msg'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('collab.plan_leave'), style: 'destructive', onPress: async () => {
                  const ok = await leaveCollaboration();
                  if (ok) router.replace('/(app)/(tabs)/explore/planner' as never);
                }},
              ]);
            }}>
              <Ionicons name="exit-outline" size={16} color={theme.red} />
              <Text style={[styles.leaveBtnText, { color: theme.red }]}>{t('collab.plan_leave')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('planner.stops')}</Text>
            {isOwner && (
              <TouchableOpacity style={styles.addBtn} onPress={handleAddStop} disabled={saving}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addBtnText}>{t('planner.add_stop')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {stops.length === 0 ? (
            <View style={styles.emptyStops}>
              <Ionicons name="navigate-outline" size={32} color={theme.border} />
              <Text style={styles.emptyText}>{t('planner.no_stops')}</Text>
            </View>
          ) : (
            <View>
              {stops.map(stop => (
                <TripPlanStopItem key={stop.id} stop={stop} isOwner={isOwner} onUpdate={isOwner ? updateStop : undefined} onDelete={isOwner ? deleteStop : undefined} />
              ))}
            </View>
          )}

          <View style={styles.divider} />
          <BudgetSection budget={plan.budget_estimate || {}} isOwner={isOwner} onUpdate={handleBudgetUpdate} />
          <View style={styles.divider} />
          <ChecklistSection items={checklist} isOwner={isOwner} onToggle={toggleChecklistItem} onAdd={isOwner ? addChecklistItem : undefined} onDelete={isOwner ? deleteChecklistItem : undefined} />
        </View>
      </ScrollView>

      <CoverImagePicker visible={showCoverPicker} itemId={id as string} table="trip_plans" userId={user?.id} destinations={plan.destinations || []} onCoverSet={(url) => updatePlan({ cover_image_url: url })} onClose={() => setShowCoverPicker(false)} />

      <InviteCollaboratorModal
        visible={showCollabModal}
        onClose={() => setShowCollabModal(false)}
        onInvite={inviteCollaborator}
        excludedUserIds={[plan?.author_id || '', ...collaborators.map(c => c.user_id), ...pending.map(p => p.user_id)]}
      />

      {/* Edit Metadata Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditVisible(false)}><Text style={styles.modalCancel}>{t('common.cancel')}</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{t('plan_edit.title')}</Text>
            <TouchableOpacity onPress={handleSaveMetadata} disabled={saving}><Text style={[styles.modalSave, saving && { opacity: 0.4 }]}>{t('common.save')}</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('planner.title_label')}</Text>
              <TextInput style={styles.modalInput} value={editForm.title} onChangeText={v => setEditForm(p => ({ ...p, title: v }))} placeholder={t('planner.title_placeholder')} placeholderTextColor={theme.textMuted} />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('planner.description_label')}</Text>
              <TextInput style={[styles.modalInput, styles.modalTextArea]} value={editForm.description} onChangeText={v => setEditForm(p => ({ ...p, description: v }))} placeholder={t('planner.description_placeholder')} placeholderTextColor={theme.textMuted} multiline numberOfLines={3} />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('planner.destinations_label')}</Text>
              <TextInput style={styles.modalInput} value={editForm.destinations} onChangeText={v => setEditForm(p => ({ ...p, destinations: v }))} placeholder={t('planner.destinations_placeholder')} placeholderTextColor={theme.textMuted} />
            </View>
            <View style={styles.modalRow}>
              <View style={[styles.modalField, { flex: 1 }]}>
                <Text style={styles.modalLabel}>{t('planner.start_date_label')}</Text>
                <TextInput style={styles.modalInput} value={editForm.start_date} onChangeText={v => setEditForm(p => ({ ...p, start_date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} />
              </View>
              <View style={[styles.modalField, { flex: 1 }]}>
                <Text style={styles.modalLabel}>{t('planner.end_date_label')}</Text>
                <TextInput style={styles.modalInput} value={editForm.end_date} onChangeText={v => setEditForm(p => ({ ...p, end_date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} />
              </View>
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('plan_edit.visibility_label')}</Text>
              <View style={styles.visibilityRow}>
                {(['private', 'public', 'friends'] as Visibility[]).map(v => (
                  <TouchableOpacity key={v} style={[styles.visibilityBtn, editForm.visibility === v && styles.visibilityBtnActive]} onPress={() => setEditForm(p => ({ ...p, visibility: v }))}>
                    <Text style={[styles.visibilityBtnText, editForm.visibility === v && styles.visibilityBtnTextActive]}>{t(`plan_edit.visibility_${v}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(t: AppTheme, topInset: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg, gap: 12 },
    errorText: { fontSize: 17, color: t.textSecondary },
    backBtn: { backgroundColor: t.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
    backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    cover: { width: SCREEN_WIDTH, height: 240, resizeMode: 'cover' },
    coverPlaceholder: { width: SCREEN_WIDTH, height: 160, backgroundColor: t.bgElevated, justifyContent: 'center', alignItems: 'center', gap: 10 },
    coverPlaceholderText: { fontSize: 14, color: t.textMuted, fontWeight: '500' },
    coverEditBadge: { position: 'absolute', bottom: 12, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 7 },
    floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: topInset, paddingBottom: 12 },
    floatingBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    cloneHeaderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 19, paddingHorizontal: 14, paddingVertical: 9, gap: 6, borderWidth: 1, borderColor: t.tealAlpha50 },
    cloneHeaderBtnText: { color: t.teal, fontWeight: '700', fontSize: 14 },
    content: { paddingBottom: 48 },
    padded: { paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 28, fontWeight: '900', color: t.textPrimary, marginBottom: 14, lineHeight: 34, letterSpacing: -0.8 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    pill: { backgroundColor: t.bgElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.border },
    pillText: { fontSize: 13, color: t.textSecondary, fontWeight: '500' },
    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 13, color: t.textMuted, fontWeight: '500' },
    description: { fontSize: 15, color: t.textSecondary, lineHeight: 22, marginBottom: 4 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: t.textPrimary },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.teal, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, gap: 4 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    emptyStops: { alignItems: 'center', paddingVertical: 24, gap: 10 },
    emptyText: { fontSize: 15, color: t.textMuted, textAlign: 'center' },
    collabSection: { marginBottom: 16 },
    collabLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
    leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 8 },
    leaveBtnText: { fontSize: 14, fontWeight: '600' },
    modalContainer: { flex: 1, backgroundColor: t.bg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    modalCancel: { fontSize: 16, color: t.textSecondary },
    modalTitle: { fontSize: 17, fontWeight: '700', color: t.textPrimary },
    modalSave: { fontSize: 16, fontWeight: '700', color: t.teal },
    modalBody: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
    modalField: { marginTop: 20 },
    modalRow: { flexDirection: 'row', gap: 12 },
    modalLabel: { fontSize: 11, fontWeight: '700', color: t.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    modalInput: { borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.textPrimary, backgroundColor: t.bgElevated },
    modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
    visibilityRow: { flexDirection: 'row', gap: 8 },
    visibilityBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bgElevated, borderWidth: 1.5, borderColor: t.border, alignItems: 'center' },
    visibilityBtnActive: { backgroundColor: t.tealAlpha10, borderColor: t.teal },
    visibilityBtnText: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    visibilityBtnTextActive: { color: t.teal },
  });
}
