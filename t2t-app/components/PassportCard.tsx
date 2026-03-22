import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Palette } from '@/constants/theme';

interface PassportCardProps {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  travelStyle: string | null;
  memberSince: string;
  countries: string[];
  stats: {
    diaries: number;
    followers: number;
    following: number;
  };
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onEditPress?: () => void;
  onFollowPress?: () => void;
  onSharePress?: () => void;
}

/**
 * Passport-style profile card — the user's travel identity.
 * Dark navy background, gold accents, country stamps, passport photo layout.
 */
export function PassportCard({
  displayName, username, avatarUrl, bio, travelStyle,
  memberSince, countries, stats, isOwnProfile,
  isFollowing, onEditPress, onFollowPress, onSharePress,
}: PassportCardProps) {
  const { t } = useTranslation();
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    cardOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const issueDate = new Date(memberSince).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase();

  return (
    <Animated.View style={[styles.card, cardAnimStyle]}>
      {/* Gold border accent line at top */}
      <View style={styles.goldLine} />

      {/* Passport header */}
      <View style={styles.passportHeader}>
        <Text style={styles.passportLabel}>TRAVEL PASSPORT</Text>
        <Ionicons name="earth" size={18} color={Palette.passGold} />
      </View>

      {/* Main content row: photo + info */}
      <View style={styles.mainRow}>
        {/* Passport photo */}
        <View style={styles.photoFrame}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoFallback}>
              <Text style={styles.photoInitials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Info fields */}
        <View style={styles.infoFields}>
          <PassportField label={t('passport.name')} value={displayName || t('common.anonymous')} />
          {username && <PassportField label={t('passport.handle')} value={`@${username}`} />}
          <PassportField label={t('passport.issued')} value={issueDate} />
          {travelStyle && <PassportField label={t('passport.style')} value={travelStyle} />}
        </View>
      </View>

      {/* Bio */}
      {bio && (
        <Text style={styles.bio} numberOfLines={2}>{bio}</Text>
      )}

      {/* Stats row — passport-style */}
      <View style={styles.statsRow}>
        <StatBadge label={t('passport.journeys')} value={stats.diaries} />
        <View style={styles.statDivider} />
        <StatBadge label={t('passport.followers')} value={stats.followers} />
        <View style={styles.statDivider} />
        <StatBadge label={t('passport.following')} value={stats.following} />
      </View>

      {/* Country stamps */}
      {countries.length > 0 && (
        <View style={styles.stampsSection}>
          <Text style={styles.stampsLabel}>{t('passport.stamps')}</Text>
          <View style={styles.stampsGrid}>
            {countries.slice(0, 12).map((country, idx) => (
              <CountryStamp key={country} country={country} index={idx} />
            ))}
            {countries.length > 12 && (
              <View style={styles.moreStamp}>
                <Text style={styles.moreStampText}>+{countries.length - 12}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
            <Ionicons name="create-outline" size={16} color={Palette.passGold} />
            <Text style={styles.editBtnText}>{t('profile.edit')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={onFollowPress}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? t('profile.following_button') : t('profile.follow')}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.shareBtn} onPress={onSharePress}>
          <Ionicons name="share-outline" size={18} color={Palette.passGold} />
        </TouchableOpacity>
      </View>

      {/* Bottom decorative line */}
      <View style={styles.goldLineBottom} />
    </Animated.View>
  );
}

function PassportField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CountryStamp({ country, index }: { country: string; index: number }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 60,
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.stamp, animStyle]}>
      <Text style={styles.stampText}>{country}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.navy,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 4,
    overflow: 'hidden',
    // Subtle gold glow
    shadowColor: Palette.passGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.15)',
  },

  goldLine: {
    height: 3,
    backgroundColor: Palette.passGold,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    opacity: 0.8,
  },
  goldLineBottom: {
    height: 2,
    backgroundColor: Palette.passGold,
    opacity: 0.4,
    marginTop: 4,
  },

  passportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  passportLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.passGold,
    letterSpacing: 3,
    opacity: 0.7,
  },

  mainRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  photoFrame: {
    width: 80,
    height: 100,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(212,168,83,0.3)',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    backgroundColor: Palette.passStamp,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInitials: {
    fontSize: 24,
    fontWeight: '900',
    color: Palette.passGold,
    letterSpacing: -1,
  },

  infoFields: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  field: {},
  fieldLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(212,168,83,0.5)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8E0D0',
    letterSpacing: -0.2,
  },

  bio: {
    fontSize: 13,
    color: 'rgba(232,224,208,0.65)',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,83,0.15)',
    marginHorizontal: 12,
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E8E0D0',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(212,168,83,0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(212,168,83,0.15)',
  },

  // Country stamps
  stampsSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  stampsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(212,168,83,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stamp: {
    backgroundColor: Palette.passStamp,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.2)',
  },
  stampText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E8E0D0',
    letterSpacing: 0.3,
  },
  moreStamp: {
    backgroundColor: 'rgba(212,168,83,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.15)',
  },
  moreStampText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.passGold,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.3)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.passGold,
  },
  followBtn: {
    flex: 1,
    backgroundColor: Palette.teal,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(232,224,208,0.25)',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  followBtnTextActive: {
    color: '#E8E0D0',
  },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
