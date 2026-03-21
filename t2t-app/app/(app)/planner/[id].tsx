import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions,
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
import type { TripPlanStop } from '@/types/tripPlan';

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
        {isOwner ? (
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cover */}
        {plan.cover_image_url ? (
          <Image source={{ uri: plan.cover_image_url }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="map-outline" size={48} color="#ccc" />
          </View>
        )}

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
            onUpdate={async (budget) => updatePlan({ budget_estimate: budget })}
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
});
