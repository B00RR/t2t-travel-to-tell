import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions, Share,
  Modal, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTripPlanDetail } from '@/hooks/useTripPlanDetail';
import { useCreateTripPlan } from '@/hooks/useCreateTripPlan';
import { TripPlanStopItem } from '@/components/TripPlanStopItem';
import { ChecklistSection } from '@/components/ChecklistSection';
import { BudgetSection } from '@/components/BudgetSection';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import type { TripPlanStop, TripPlan } from '@/types/tripPlan';

type Visibility = TripPlan['visibility'];

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TripPlanDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const {
    plan, stops, checklist, loading, saving,
    fetchPlan, deletePlan, updatePlan, updateStop, deleteStop,
    toggleChecklistItem, addChecklistItem, deleteChecklistItem,
    addStop,
  } = useTripPlanDetail(id);

  const { creating, clonePlan } = useCreateTripPlan(user?.id);

  const isOwner = plan?.author_id === user?.id;

  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Edit metadata modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    destinations: '',
    start_date: '',
    end_date: '',
    visibility: 'private' as Visibility,
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
    if (!editForm.title.trim()) {
      Alert.alert(t('common.error'), t('planner.err_title_required'));
      return;
    }
    const destinations = editForm.destinations
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);
    await updatePlan({
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      destinations,
      start_date: editForm.start_date.trim() || null,
      end_date: editForm.end_date.trim() || null,
      visibility: editForm.visibility,
    });
    setEditVisible(false);
  }

  const handleBudgetUpdate = useCallback(
    (budget: object) => updatePlan({ budget_estimate: budget }),
    [updatePlan]
  );

  useFocusEffect(
    useCallback(() => {
      if (id) fetchPlan();
    }, [id, fetchPlan])
  );

  async function handleDelete() {
    Alert.alert(
      t('planner.delete_confirm_title'),
      t('planner.delete_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('planner.delete_btn'),
          style: 'destructive',
          onPress: async () => {
            const ok = await deletePlan();
            if (ok) router.replace('/(app)/(tabs)/planner');
          },
        },
      ]
    );
  }

  async function handleShare() {
    if (!plan) return;
    const dests = plan.destinations?.join(', ') || '';

    const lines: string[] = [];
    lines.push(`🗺️ ${plan.title}`);
    if (dests) lines.push(`📍 ${dests}`);
    if (plan.start_date) {
      lines.push(`📅 ${plan.start_date}${plan.end_date ? ` → ${plan.end_date}` : ''}`);
    }
    if (plan.description) lines.push(`\n${plan.description}`);

    if (stops.length > 0) {
      lines.push(`\n📌 ${t('planner.stops').toUpperCase()}:`);
      stops.forEach(s => {
        const dayLabel = `${t('diary.day_label', { number: s.day_number })}`;
        const parts = [dayLabel, s.title, s.location_name].filter(Boolean).join(' — ');
        lines.push(`  ${parts}`);
      });
    }

    const budget = plan.budget_estimate as Record<string, any> | null;
    if (budget?.total) {
      lines.push(`\n💰 Budget: ${budget.total} ${budget.currency || 'EUR'}`);
    }

    lines.push(`\n✈️ Pianifica su T2T — Travel to Tell`);

    try {
      await Share.share({ message: lines.join('\n'), title: plan.title });
    } catch (_) {}
  }

  async function handleClone() {
    if (!plan) return;
    const newId = await clonePlan(plan.id);
    if (newId) {
      Alert.alert(t('planner.cloned'), '', [
        { text: 'OK', onPress: () => router.replace(`/planner/${newId}`) },
      ]);
    }
  }

  async function handleAddStop() {
    const nextDay = stops.length > 0 ? Math.max(...stops.map(s => s.day_number)) + 1 : 1;
    await addStop({
      day_number: nextDay,
      title: null,
      location_name: null,
      notes: null,
      sort_order: nextDay,
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('planner.not_found')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{t('diary.go_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          {isOwner ? (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={openEditModal}>
                <Ionicons name="create-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </>
          ) : plan.visibility === 'public' ? (
          <TouchableOpacity
            style={styles.cloneHeaderBtn}
            onPress={handleClone}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <Ionicons name="copy-outline" size={16} color="#007AFF" />
                <Text style={styles.cloneHeaderBtnText}>{t('planner.clone')}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cover */}
        <TouchableOpacity
          activeOpacity={isOwner ? 0.8 : 1}
          onPress={() => isOwner && setShowCoverPicker(true)}
        >
          {plan.cover_image_url ? (
            <Image source={{ uri: plan.cover_image_url }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="map-outline" size={48} color="#ccc" />
              {isOwner && (
                <Text style={styles.coverPlaceholderText}>{t('cover.add_cover')}</Text>
              )}
            </View>
          )}
          {isOwner && plan.cover_image_url && (
            <View style={styles.coverEditBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.padded}>
          {/* Title */}
          <Text style={styles.title}>{plan.title}</Text>

          {/* Destinations */}
          {plan.destinations && plan.destinations.length > 0 && (
            <View style={styles.pillRow}>
              {plan.destinations.map((dest, idx) => (
                <View key={idx} style={styles.pill}>
                  <Text style={styles.pillText}>📍 {dest}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Dates */}
          {plan.start_date && (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.dateText}>
                {plan.start_date}
                {plan.end_date ? ` → ${plan.end_date}` : ''}
              </Text>
            </View>
          )}

          {/* Description */}
          {plan.description ? (
            <Text style={styles.description}>{plan.description}</Text>
          ) : null}

          {/* Clone count badge */}
          {plan.clone_count > 0 && (
            <View style={styles.cloneCountRow}>
              <Ionicons name="copy-outline" size={14} color="#999" />
              <Text style={styles.cloneCountText}>
                {t('planner.clone_count', { count: plan.clone_count })}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Stops section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('planner.stops')}</Text>
            {isOwner && (
              <TouchableOpacity style={styles.addBtn} onPress={handleAddStop} disabled={saving}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addBtnText}>{t('planner.add_stop')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {stops.length === 0 ? (
            <Text style={styles.emptyText}>{t('planner.no_stops')}</Text>
          ) : (
            stops.map(stop => (
              <TripPlanStopItem
                key={stop.id}
                stop={stop}
                isOwner={isOwner}
                onUpdate={isOwner ? updateStop : undefined}
                onDelete={isOwner ? deleteStop : undefined}
              />
            ))
          )}

          <View style={styles.divider} />

          {/* Budget section */}
          <BudgetSection
            budget={plan.budget_estimate || {}}
            isOwner={isOwner}
            onUpdate={handleBudgetUpdate}
          />

          <View style={styles.divider} />

          {/* Checklist section */}
          <ChecklistSection
            items={checklist}
            isOwner={isOwner}
            onToggle={toggleChecklistItem}
            onAdd={isOwner ? addChecklistItem : undefined}
            onDelete={isOwner ? deleteChecklistItem : undefined}
          />
        </View>
      </ScrollView>

      <CoverImagePicker
        visible={showCoverPicker}
        itemId={id as string}
        table="trip_plans"
        userId={user?.id}
        destinations={plan.destinations || []}
        onCoverSet={(url) => updatePlan({ cover_image_url: url })}
        onClose={() => setShowCoverPicker(false)}
      />

      {/* Edit Metadata Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={styles.modalCancel}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('plan_edit.title')}</Text>
            <TouchableOpacity onPress={handleSaveMetadata} disabled={saving}>
              <Text style={[styles.modalSave, saving && { opacity: 0.4 }]}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('planner.title_label')}</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.title}
                onChangeText={v => setEditForm(p => ({ ...p, title: v }))}
                placeholder={t('planner.title_placeholder')}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('planner.description_label')}</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editForm.description}
                onChangeText={v => setEditForm(p => ({ ...p, description: v }))}
                placeholder={t('planner.description_placeholder')}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('planner.destinations_label')}</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.destinations}
                onChangeText={v => setEditForm(p => ({ ...p, destinations: v }))}
                placeholder={t('planner.destinations_placeholder')}
              />
            </View>

            <View style={styles.modalRow}>
              <View style={[styles.modalField, { flex: 1 }]}>
                <Text style={styles.modalLabel}>{t('planner.start_date_label')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editForm.start_date}
                  onChangeText={v => setEditForm(p => ({ ...p, start_date: v }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={[styles.modalField, { flex: 1 }]}>
                <Text style={styles.modalLabel}>{t('planner.end_date_label')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editForm.end_date}
                  onChangeText={v => setEditForm(p => ({ ...p, end_date: v }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('plan_edit.visibility_label')}</Text>
              <View style={styles.visibilityRow}>
                {(['private', 'public', 'friends'] as Visibility[]).map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.visibilityBtn, editForm.visibility === v && styles.visibilityBtnActive]}
                    onPress={() => setEditForm(p => ({ ...p, visibility: v }))}
                  >
                    <Text style={[styles.visibilityBtnText, editForm.visibility === v && styles.visibilityBtnTextActive]}>
                      {t(`plan_edit.visibility_${v}`)}
                    </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  iconBtn: {
    padding: 8,
  },
  cloneHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
  },
  cloneHeaderBtnText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cover: {
    width: SCREEN_WIDTH,
    height: 200,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: SCREEN_WIDTH,
    height: 140,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  coverPlaceholderText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  coverEditBadge: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    padding: 6,
  },
  content: {
    paddingBottom: 40,
  },
  padded: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 32,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  cloneCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  cloneCountText: {
    fontSize: 13,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalField: {
    marginTop: 20,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  visibilityBtnActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#007AFF',
  },
  visibilityBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  visibilityBtnTextActive: {
    color: '#007AFF',
  },
});
