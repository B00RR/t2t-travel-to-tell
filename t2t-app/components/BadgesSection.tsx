/**
 * Gamification: badge visivi calcolati dai dati del profilo.
 * Non richiede nuove tabelle DB — usa stats già esistenti.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

interface BadgeDefinition {
  id: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  check: (stats: BadgeStats) => boolean;
  tier: 'bronze' | 'silver' | 'gold';
}

export interface BadgeStats {
  diaries: number;
  countries: number;
  followers: number;
  totalLikes: number;
}

const BADGE_DEFS: BadgeDefinition[] = [
  {
    id: 'first_journey',
    emoji: '✈️',
    titleKey: 'badges.first_journey',
    descKey: 'badges.first_journey_desc',
    check: s => s.diaries >= 1,
    tier: 'bronze',
  },
  {
    id: 'storyteller',
    emoji: '📖',
    titleKey: 'badges.storyteller',
    descKey: 'badges.storyteller_desc',
    check: s => s.diaries >= 5,
    tier: 'silver',
  },
  {
    id: 'elite_traveler',
    emoji: '🏆',
    titleKey: 'badges.elite_traveler',
    descKey: 'badges.elite_traveler_desc',
    check: s => s.diaries >= 20,
    tier: 'gold',
  },
  {
    id: 'globetrotter',
    emoji: '🌍',
    titleKey: 'badges.globetrotter',
    descKey: 'badges.globetrotter_desc',
    check: s => s.countries >= 5,
    tier: 'silver',
  },
  {
    id: 'marco_polo',
    emoji: '🗺️',
    titleKey: 'badges.marco_polo',
    descKey: 'badges.marco_polo_desc',
    check: s => s.countries >= 20,
    tier: 'gold',
  },
  {
    id: 'popular',
    emoji: '❤️',
    titleKey: 'badges.popular',
    descKey: 'badges.popular_desc',
    check: s => s.totalLikes >= 50,
    tier: 'silver',
  },
  {
    id: 'influencer',
    emoji: '🌟',
    titleKey: 'badges.influencer',
    descKey: 'badges.influencer_desc',
    check: s => s.totalLikes >= 500,
    tier: 'gold',
  },
  {
    id: 'social_butterfly',
    emoji: '🤝',
    titleKey: 'badges.social_butterfly',
    descKey: 'badges.social_butterfly_desc',
    check: s => s.followers >= 50,
    tier: 'silver',
  },
  {
    id: 'explorer',
    emoji: '🧭',
    titleKey: 'badges.explorer',
    descKey: 'badges.explorer_desc',
    check: s => s.countries >= 10,
    tier: 'bronze',
  },
];

const TIER_COLORS = {
  bronze: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
  silver: { bg: '#f5f5f5', border: '#9e9e9e', text: '#616161' },
  gold:   { bg: '#fffde7', border: '#ffc107', text: '#f57f17' },
};

function computeLevel(stats: BadgeStats): { level: number; xp: number; nextXp: number } {
  const xp =
    stats.diaries * 10 +
    stats.countries * 15 +
    Math.floor(stats.totalLikes / 5) +
    Math.floor(stats.followers / 2);

  const thresholds = [0, 50, 150, 350, 700, 1200, 2000, 3500, 6000, 10000];
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) { level = i + 1; break; }
  }

  return {
    level,
    xp,
    nextXp: thresholds[Math.min(level, thresholds.length - 1)] || xp,
  };
}

interface BadgesSectionProps {
  stats: BadgeStats;
  isOwnProfile?: boolean;
}

export function BadgesSection({ stats, isOwnProfile }: BadgesSectionProps) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const { earned, locked, level, xp, nextXp } = useMemo(() => {
    const earned = BADGE_DEFS.filter(b => b.check(stats));
    const locked = BADGE_DEFS.filter(b => !b.check(stats));
    const { level, xp, nextXp } = computeLevel(stats);
    return { earned, locked, level, xp, nextXp };
  }, [stats]);

  const levelTitle = t(`badges.lvl_${Math.min(level, 10)}`);
  const progress = nextXp > 0 ? Math.min(xp / nextXp, 1) : 1;

  return (
    <View>
      {/* Level bar */}
      <View style={styles.levelCard}>
        <View style={styles.levelTop}>
          <View>
            <Text style={styles.levelNum}>Lv. {level}</Text>
            <Text style={styles.levelTitle}>{levelTitle}</Text>
          </View>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        {level < 10 && (
          <Text style={styles.nextLevelText}>{t('badges.next_level', { xp: nextXp - xp })}</Text>
        )}
      </View>

      {/* Earned badges */}
      {earned.length > 0 && (
        <View style={styles.badgesRow}>
          {earned.map(badge => {
            const colors = TIER_COLORS[badge.tier];
            return (
              <TouchableOpacity
                key={badge.id}
                style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}
                onPress={() => setShowAll(true)}
              >
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={2}>
                  {t(badge.titleKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
          {locked.length > 0 && (
            <TouchableOpacity style={[styles.badge, styles.badgeLocked]} onPress={() => setShowAll(true)}>
              <Text style={styles.badgeEmoji}>🔒</Text>
              <Text style={styles.badgeLockedText} numberOfLines={2}>
                {t('badges.more', { count: locked.length })}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {earned.length === 0 && isOwnProfile && (
        <TouchableOpacity style={styles.noBadgesBtn} onPress={() => setShowAll(true)}>
          <Text style={styles.noBadgesText}>{t('badges.none_yet')}</Text>
        </TouchableOpacity>
      )}

      {/* All badges modal */}
      <Modal visible={showAll} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('badges.all_badges')}</Text>
              <TouchableOpacity onPress={() => setShowAll(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BADGE_DEFS.map(badge => {
                const unlocked = badge.check(stats);
                const colors = TIER_COLORS[badge.tier];
                return (
                  <View
                    key={badge.id}
                    style={[styles.modalBadgeRow, !unlocked && styles.modalBadgeRowLocked]}
                  >
                    <View style={[
                      styles.modalBadgeIcon,
                      unlocked ? { backgroundColor: colors.bg, borderColor: colors.border } : styles.lockedIcon,
                    ]}>
                      <Text style={[styles.modalBadgeEmoji, !unlocked && { opacity: 0.3 }]}>
                        {badge.emoji}
                      </Text>
                    </View>
                    <View style={styles.modalBadgeInfo}>
                      <Text style={[styles.modalBadgeName, !unlocked && styles.lockedText]}>
                        {t(badge.titleKey)}
                      </Text>
                      <Text style={styles.modalBadgeDesc}>{t(badge.descKey)}</Text>
                    </View>
                    {unlocked && <Text style={styles.check}>✓</Text>}
                  </View>
                );
              })}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  levelCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  levelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  levelNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#007AFF',
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 2,
  },
  xpText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#d0e8ff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
    textAlign: 'right',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  badgeLocked: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  badgeEmoji: {
    fontSize: 26,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeLockedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#bbb',
    textAlign: 'center',
  },
  noBadgesBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  noBadgesText: {
    fontSize: 14,
    color: '#aaa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeBtn: {
    fontSize: 18,
    color: '#999',
    padding: 4,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalBadgeRowLocked: {
    opacity: 0.6,
  },
  modalBadgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  modalBadgeEmoji: {
    fontSize: 26,
  },
  modalBadgeInfo: {
    flex: 1,
  },
  modalBadgeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  modalBadgeDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  lockedText: {
    color: '#aaa',
  },
  check: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: '700',
  },
});
