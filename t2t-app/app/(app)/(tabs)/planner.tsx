import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTripPlans } from '@/hooks/useTripPlans';
import { useCreateTripPlan } from '@/hooks/useCreateTripPlan';
import { TripPlanCard } from '@/components/TripPlanCard';
import { DiaryCardSkeleton } from '@/components/Skeleton';
import type { TripPlan } from '@/types/tripPlan';

type Tab = 'my' | 'discover';

export default function PlannerScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('my');

  const { myPlans, publicPlans, loading, refreshing, fetchMyPlans, fetchPublicPlans, refresh } =
    useTripPlans(user?.id);
  const { creating, clonePlan } = useCreateTripPlan(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'my') {
        fetchMyPlans(false);
      } else {
        fetchPublicPlans(false);
      }
    }, [activeTab, fetchMyPlans, fetchPublicPlans])
  );

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === 'my') {
      fetchMyPlans(false);
    } else {
      fetchPublicPlans(false);
    }
  }

  async function handleClone(planId: string) {
    if (!user) return;
    const newId = await clonePlan(planId);
    if (newId) {
      Alert.alert(t('planner.cloned'), '', [
        {
          text: 'OK',
          onPress: () => {
            setActiveTab('my');
            fetchMyPlans(false);
            router.push(`/planner/${newId}`);
          },
        },
      ]);
    }
  }

  const plans = activeTab === 'my' ? myPlans : publicPlans;

  const renderCard = useCallback(
    ({ item }: { item: TripPlan }) => (
      <TripPlanCard
        item={item}
        userId={user?.id}
        onClone={activeTab === 'discover' ? handleClone : undefined}
      />
    ),
    [user?.id, activeTab]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('planner.tab')}</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/planner/create')}
          disabled={creating}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my' && styles.tabBtnActive]}
          onPress={() => handleTabChange('my')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'my' && styles.tabBtnTextActive]}>
            {t('planner.my_plans')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'discover' && styles.tabBtnActive]}
          onPress={() => handleTabChange('discover')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'discover' && styles.tabBtnTextActive]}>
            {t('planner.discover')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.listContent}>
          <DiaryCardSkeleton />
          <DiaryCardSkeleton />
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {activeTab === 'my' ? t('planner.empty') : t('planner.empty_discover')}
          </Text>
          {activeTab === 'my' && (
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/planner/create')}
            >
              <Text style={styles.emptyBtnText}>{t('planner.new_plan')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refresh(activeTab)}
              tintColor="#007AFF"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
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
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
  },
  tabBtnActive: {
    backgroundColor: '#007AFF',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
