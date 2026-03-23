/**
 * Gamification: badge visivi calcolati dai dati del profilo.
 * Non richiede nuove tabelle DB — usa stats già esistenti.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';

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

/** Returns how many more units are needed to unlock a badge, and which stat drives it. */
function badgeHint(badge: BadgeDefinition, stats: BadgeStats): string | null {
  const id = badge.id;
  if (id === 'first_journey')   return `${Math.max(0, 1  - stats.diaries)} diari`;
  if (id === 'storyteller')     return `${Math.max(0, 5  - stats.diaries)} diari`;
  if (id === 'elite_traveler')  return `${Math.max(0, 20 - stats.diaries)} diari`;
  if (id === 'globetrotter')    return `${Math.max(0, 5  - stats.countries)} destinazioni`;
  if (id === 'marco_polo')      return `${Math.max(0, 20 - stats.countries)} destinazioni`;
  if (id === 'explorer')        return `${Math.max(0, 10 - stats.countries)} destinazioni`;
  if (id === 'popular')         return `${Math.max(0, 50  - stats.totalLikes)} like`;
  if (id === 'influencer')      return `${Math.max(0, 500 - stats.totalLikes)} like`;
  if (id === 'social_butterfly')return `${Math.max(0, 50  - stats.followers)} follower`;
  return null;
}

export function BadgesSection({ stats, isOwnProfile }: BadgesSectionProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [showAll, setShowAll] = useState(false);

  const tierColors = useMemo(() => ({
    bronze: { bg: 'rgba(249,115,22,0.12)', border: theme.orange, text: theme.orange },
    silver: { bg: theme.bgElevated, border: theme.textMuted, text: theme.textSecondary },
    gold:   { bg: 'rgba(245,200,66,0.12)', border: theme.orange, text: theme.orange },
  }), [theme]);

  const { earned, locked, level, xp, nextXp, nextBadge } = useMemo(() => {
    const earned = BADGE_DEFS.filter(b => b.check(stats));
    const locked = BADGE_DEFS.filter(b => !b.check(stats));
    const { level, xp, nextXp } = computeLevel(stats);
    // Badge più vicino = quello con il hint numerico più basso
    let nextBadge: { badge: BadgeDefinition; hint: string } | null = null;
    let minGap = Infinity;
    for (const b of locked) {
      const hint = badgeHint(b, stats);
      if (!hint) continue;
      const gap = parseInt(hint, 10);
      if (!isNaN(gap) && gap < minGap) {
        minGap = gap;
        nextBadge = { badge: b, hint };
      }
    }
    return { earned, locked, level, xp, nextXp, nextBadge };
  }, [stats]);

  const levelTitle = t(`badges.lvl_${Math.min(level, 10)}`);
  const progress = nextXp > 0 ? Math.min(xp / nextXp, 1) : 1;

  return (
    <View>
      {/* Level bar */}
      <View style={[styles.levelCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <View style={styles.levelTop}>
          <View>
            <Text style={[styles.levelNum, { color: theme.teal }]}>Lv. {level}</Text>
            <Text style={[styles.levelTitle, { color: theme.textSecondary }]}>{levelTitle}</Text>
          </View>
          <Text style={[styles.xpText, { color: theme.teal }]}>{xp} XP</Text>
        </View>
        <View style={[styles.progressBg, { backgroundColor: theme.bgElevated }]}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.teal }]} />
        </View>
        {level < 10 && (
          <Text style={[styles.nextLevelText, { color: theme.textMuted }]}>{t('badges.next_level', { xp: nextXp - xp })}</Text>
        )}
        {nextBadge && (
          <View style={[styles.nextBadgeRow, { borderTopColor: theme.border }]}>
            <Text style={styles.nextBadgeEmoji}>{nextBadge.badge.emoji}</Text>
            <View style={styles.nextBadgeInfo}>
              <Text style={[styles.nextBadgeLabel, { color: theme.textMuted }]}>{t('badges.next_badge')}</Text>
              <Text style={[styles.nextBadgeName, { color: theme.teal }]}>{t(nextBadge.badge.titleKey)}</Text>
            </View>
            <View style={[styles.nextBadgeHintPill, { backgroundColor: theme.tealDim }]}>
              <Text style={[styles.nextBadgeHintText, { color: theme.bg }]}>-{nextBadge.hint}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Earned badges */}
      {earned.length > 0 && (
        <View style={styles.badgesRow}>
          {earned.map(badge => {
            const colors = tierColors[badge.tier];
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
            <TouchableOpacity
              style={[styles.badge, styles.badgeLocked, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}
              onPress={() => setShowAll(true)}
            >
              <Text style={styles.badgeEmoji}>🔒</Text>
              <Text style={[styles.badgeLockedText, { color: theme.textMuted }]} numberOfLines={2}>
                {t('badges.more', { count: locked.length })}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {earned.length === 0 && isOwnProfile && (
        <TouchableOpacity style={[styles.noBadgesBtn, { borderColor: theme.border }]} onPress={() => setShowAll(true)}>
          <Text style={[styles.noBadgesText, { color: theme.textMuted }]}>{t('badges.none_yet')}</Text>
        </TouchableOpacity>
      )}

      {/* All badges modal */}
      <Modal visible={showAll} animationType="slide" transparent onRequestClose={() => setShowAll(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modal, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('badges.all_badges')}</Text>
              <TouchableOpacity onPress={() => setShowAll(false)}>
                <Text style={[styles.closeBtn, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BADGE_DEFS.map(badge => {
                const unlocked = badge.check(stats);
                const colors = tierColors[badge.tier];
                return (
                  <View
                    key={badge.id}
                    style={[styles.modalBadgeRow, { borderBottomColor: theme.border }, !unlocked && styles.modalBadgeRowLocked]}
                  >
                    <View style={[
                      styles.modalBadgeIcon,
                      unlocked
                        ? { backgroundColor: colors.bg, borderColor: colors.border }
                        : { backgroundColor: theme.bgElevated, borderColor: theme.border },
                    ]}>
                      <Text style={[styles.modalBadgeEmoji, !unlocked && { opacity: 0.3 }]}>
                        {badge.emoji}
                      </Text>
                    </View>
                    <View style={styles.modalBadgeInfo}>
                      <Text style={[styles.modalBadgeName, { color: unlocked ? theme.textPrimary : theme.textMuted }]}>
                        {t(badge.titleKey)}
                      </Text>
                      <Text style={[styles.modalBadgeDesc, { color: theme.textMuted }]}>{t(badge.descKey)}</Text>
                    </View>
                    {unlocked && <Text style={[styles.check, { color: theme.teal }]}>✓</Text>}
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
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
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  xpText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  nextBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  nextBadgeEmoji: {
    fontSize: 22,
  },
  nextBadgeInfo: {
    flex: 1,
  },
  nextBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nextBadgeName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  nextBadgeHintPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  nextBadgeHintText: {
    fontSize: 12,
    fontWeight: '700',
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
    textAlign: 'center',
  },
  noBadgesBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noBadgesText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
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
  },
  closeBtn: {
    fontSize: 18,
    padding: 4,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalBadgeRowLocked: {
    opacity: 0.5,
  },
  modalBadgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  modalBadgeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  check: {
    fontSize: 18,
    fontWeight: '700',
  },
});
