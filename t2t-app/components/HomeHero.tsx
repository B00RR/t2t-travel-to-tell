import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { InteractiveGlobe } from '@/components/InteractiveGlobe';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Typography, Radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeHeroProps {
  stats?: {
    diaries?: number;
    countries?: number;
    travelers?: number;
  };
}

export function HomeHero({ stats }: HomeHeroProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      {/* Globe background */}
      <InteractiveGlobe height={320} />

      {/* Overlay content */}
      <View style={styles.overlay}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('home.hero_title', 'Esplora il mondo')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('home.hero_subtitle', 'Scopri storie di viaggiatori')}
        </Text>

        {/* Quick action */}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: theme.teal }]}
          onPress={() => router.push('/(app)/(tabs)/explore')}
          activeOpacity={0.85}
        >
          <Ionicons name="compass" size={18} color="#fff" />
          <Text style={styles.ctaText}>
            {t('home.hero_cta', 'Inizia a esplorare')}
          </Text>
        </TouchableOpacity>

        {/* Stats row */}
        {stats && (
          <View style={styles.statsRow}>
            <StatBadge
              icon="book-outline"
              value={stats.diaries ?? 0}
              label={t('home.stat_diaries', 'Diari')}
              color={theme.teal}
            />
            <StatBadge
              icon="globe-outline"
              value={stats.countries ?? 0}
              label={t('home.stat_countries', 'Paesi')}
              color={theme.orange}
            />
            <StatBadge
              icon="people-outline"
              value={stats.travelers ?? 0}
              label={t('home.stat_travelers', 'Viaggiatori')}
              color={theme.sage}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function StatBadge({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statBadge}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.xl * 2,
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  statBadge: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
});

export default HomeHero;
