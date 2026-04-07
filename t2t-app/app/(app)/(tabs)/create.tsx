import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform, Image,
  Dimensions, KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  FadeInRight, FadeInLeft, FadeInUp, FadeOutLeft, FadeOutRight,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography, Shadows, Fonts, Glass } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STEPS = 3;

type Step = 0 | 1 | 2;

export default function CreateDiaryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();

  const [step, setStep] = useState<Step>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinations, setDestinations] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Progress bar animation
  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${((progress.value + 1) / STEPS) * 100}%`,
  }));

  const goToStep = useCallback((next: Step) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withSpring(next, { damping: 20, stiffness: 90 });
    setStep(next);
  }, [progress]);

  const handlePickCover = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.error'), t('media.permission_denied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets[0]) {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      setCoverUri(manipulated.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [t]);

  async function handleCreateDiary() {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('create.err_title_required'));
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const destArray = destinations.split(',').map(d => d.trim()).filter(d => d.length > 0);

    // 1. Create the diary
    const { data, error } = await supabase
      .from('diaries')
      .insert({
        author_id: user?.id,
        title: title.trim(),
        description: description.trim(),
        destinations: destArray,
        status: 'draft',
        visibility: 'private',
      })
      .select('id')
      .single();

    if (error || !data) {
      setLoading(false);
      Alert.alert(t('common.error'), t('create.err_create_failed'));
      return;
    }

    // 2. Upload cover image if selected
    if (coverUri && user?.id) {
      const ext = 'jpg';
      const filePath = `${user.id}/covers/${data.id}.${ext}`;
      const response = await fetch(coverUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('diary-covers')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('diary-covers')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          await supabase
            .from('diaries')
            .update({ cover_image_url: urlData.publicUrl })
            .eq('id', data.id);
        }
      }
    }

    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('create.success_title'), t('create.success_msg'));
    setTitle('');
    setDescription('');
    setDestinations('');
    setCoverUri(null);
    setStep(0);
    progress.value = withTiming(0);
    router.replace('/(app)/(tabs)/home' as never);
  }

  const stepLabels = [
    t('create.step_details'),
    t('create.step_cover'),
    t('create.step_preview'),
  ];

  const canProceed = step === 0 ? title.trim().length > 0 : true;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('create.title')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textMuted, fontFamily: Fonts.handwritten }]}>
          {t('create.handwritten_note')}
        </Text>
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.progressTrack, { backgroundColor: theme.tealAlpha10 }]}>
          <Animated.View style={[styles.progressFill, { backgroundColor: theme.teal }, progressStyle]} />
        </View>
        <View style={styles.stepLabels}>
          {stepLabels.map((label, i) => (
            <TouchableOpacity
              key={label}
              onPress={() => {
                if (i < step || (i === step + 1 && canProceed)) goToStep(i as Step);
              }}
              disabled={i > step + 1 || (i > step && !canProceed)}
            >
              <View style={styles.stepLabelRow}>
                <View style={[
                  styles.stepDot,
                  {
                    backgroundColor: i <= step ? theme.teal : theme.tealAlpha10,
                    borderColor: i <= step ? theme.teal : theme.border,
                  },
                ]}>
                  {i < step ? (
                    <Ionicons name="checkmark" size={10} color={theme.buttonText} />
                  ) : (
                    <Text style={[styles.stepDotText, { color: i <= step ? theme.buttonText : theme.textMuted }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text style={[
                  styles.stepLabelText,
                  { color: i <= step ? theme.teal : theme.textMuted },
                ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Step content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <StepDetails
              theme={theme}
              t={t}
              title={title}
              setTitle={setTitle}
              destinations={destinations}
              setDestinations={setDestinations}
              description={description}
              setDescription={setDescription}
            />
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <StepCover
              theme={theme}
              t={t}
              coverUri={coverUri}
              onPickCover={handlePickCover}
            />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <StepPreview
              theme={theme}
              t={t}
              title={title}
              destinations={destinations}
              description={description}
              coverUri={coverUri}
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { borderTopColor: theme.border }]}>
        {step > 0 && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: theme.border }]}
            onPress={() => goToStep((step - 1) as Step)}
          >
            <Ionicons name="arrow-back" size={18} color={theme.textSecondary} />
            <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>{t('create.back')}</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        {step < 2 ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              { backgroundColor: theme.teal },
              !canProceed && styles.btnDisabled,
            ]}
            onPress={() => goToStep((step + 1) as Step)}
            disabled={!canProceed}
          >
            <Text style={styles.nextBtnText}>{t('create.next')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.createBtn,
              { backgroundColor: theme.teal },
              loading && styles.btnDisabled,
            ]}
            onPress={handleCreateDiary}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.createBtnText}>{t('create.create_btn')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Step Components ───────────────────────────────────────────

interface StepDetailsProps {
  theme: ReturnType<typeof useAppTheme>;
  t: (key: string) => string;
  title: string;
  setTitle: (v: string) => void;
  destinations: string;
  setDestinations: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

function StepDetails({ theme, t, title, setTitle, destinations, setDestinations, description, setDescription }: StepDetailsProps) {
  return (
    <View style={styles.stepContainer}>
      {/* Title input */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('create.title_label')}</Text>
        <TextInput
          style={[styles.inputLarge, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary }]}
          placeholder={t('create.title_placeholder')}
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />
      </View>

      {/* Destinations */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('create.destinations_label')}</Text>
        <View style={[styles.inputWithIcon, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Ionicons name="location-outline" size={18} color={theme.teal} style={styles.inputPrefixIcon} />
          <TextInput
            style={[styles.inputInner, { color: theme.textPrimary }]}
            placeholder={t('create.destinations_placeholder')}
            placeholderTextColor={theme.textMuted}
            value={destinations}
            onChangeText={setDestinations}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('create.description_label')}</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary }]}
          placeholder={t('create.description_placeholder')}
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );
}

interface StepCoverProps {
  theme: ReturnType<typeof useAppTheme>;
  t: (key: string) => string;
  coverUri: string | null;
  onPickCover: () => void;
}

function StepCover({ theme, t, coverUri, onPickCover }: StepCoverProps) {
  return (
    <View style={styles.stepContainer}>
      <TouchableOpacity
        style={[
          styles.coverPickerArea,
          {
            backgroundColor: theme.bgSurface,
            borderColor: coverUri ? theme.teal : theme.border,
          },
          coverUri && styles.coverPickerWithImage,
        ]}
        onPress={onPickCover}
        activeOpacity={0.8}
      >
        {coverUri ? (
          <View style={styles.coverImageWrapper}>
            <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.coverGradient}
            />
            <View style={styles.coverChangeOverlay}>
              <View style={[styles.coverChangeBadge, { backgroundColor: Glass.storyBg }]}>
                <Ionicons name="camera" size={16} color="#fff" />
                <Text style={styles.coverChangeText}>{t('create.cover_change')}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.coverEmptyState}>
            <View style={[styles.coverIconCircle, { backgroundColor: theme.tealAlpha10 }]}>
              <Ionicons name="image-outline" size={40} color={theme.teal} />
            </View>
            <Text style={[styles.coverHintTitle, { color: theme.textPrimary }]}>
              {t('create.cover_hint')}
            </Text>
            <Text style={[styles.coverHintSubtext, { color: theme.textMuted }]}>
              16:9 · JPEG
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {!coverUri && (
        <Text style={[styles.skipText, { color: theme.textMuted }]}>
          {t('create.skip_cover')}
        </Text>
      )}
    </View>
  );
}

interface StepPreviewProps {
  theme: ReturnType<typeof useAppTheme>;
  t: (key: string) => string;
  title: string;
  destinations: string;
  description: string;
  coverUri: string | null;
}

function StepPreview({ theme, t, title, destinations, description, coverUri }: StepPreviewProps) {
  const destArray = destinations.split(',').map(d => d.trim()).filter(d => d.length > 0);

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.previewReadyText, { color: theme.textSecondary, fontFamily: Fonts.handwritten }]}>
        {t('create.preview_ready')}
      </Text>

      {/* Preview card */}
      <View style={[styles.previewCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }, Shadows.elevated]}>
        {/* Cover */}
        {coverUri ? (
          <View style={styles.previewCoverWrapper}>
            <Image source={{ uri: coverUri }} style={styles.previewCover} resizeMode="cover" />
            <LinearGradient
              colors={
                theme.isDark
                  ? ['transparent', 'rgba(20,18,16,0.85)']
                  : ['transparent', 'rgba(250,246,240,0.90)']
              }
              style={styles.previewCoverGradient}
            />
          </View>
        ) : (
          <View style={[styles.previewCoverPlaceholder, { backgroundColor: theme.tealAlpha10 }]}>
            <Ionicons name="image-outline" size={36} color={theme.textMuted} />
          </View>
        )}

        {/* Content */}
        <View style={styles.previewContent}>
          <Text style={[styles.previewTitle, { color: theme.textPrimary }]} numberOfLines={2}>
            {title}
          </Text>

          {destArray.length > 0 && (
            <View style={styles.previewDestRow}>
              <Ionicons name="location-outline" size={14} color={theme.teal} />
              <Text style={[styles.previewDestText, { color: theme.textSecondary }]} numberOfLines={1}>
                {destArray.join(' · ')}
              </Text>
            </View>
          )}

          <Text style={[styles.previewDesc, { color: theme.textMuted }]} numberOfLines={3}>
            {description || t('create.preview_no_desc')}
          </Text>

          {/* Status pills */}
          <View style={styles.previewPills}>
            <View style={[styles.pill, { backgroundColor: theme.tealAlpha10 }]}>
              <Ionicons name="lock-closed" size={10} color={theme.teal} />
              <Text style={[styles.pillText, { color: theme.teal }]}>Draft</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: theme.orangeAlpha10 }]}>
              <Ionicons name="eye-off" size={10} color={theme.orange} />
              <Text style={[styles.pillText, { color: theme.orange }]}>Private</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h1,
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },

  // Step indicator
  stepIndicator: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  stepDotText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepLabelText: {
    ...Typography.caption,
    fontWeight: '600',
  },

  // Scroll area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },

  // Step container
  stepContainer: {
    gap: Spacing.sm,
  },

  // Form elements
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    fontFamily: Typography.body.fontFamily,
  },
  inputLarge: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    fontSize: 18,
    borderWidth: 1,
    fontFamily: Typography.h3.fontFamily,
    fontWeight: '600',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  inputPrefixIcon: {
    paddingLeft: Spacing.md,
  },
  inputInner: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: Typography.body.fontFamily,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Cover step
  coverPickerArea: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 220,
  },
  coverPickerWithImage: {
    borderStyle: 'solid',
    borderWidth: 2,
  },
  coverImageWrapper: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 220,
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  coverChangeOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
  },
  coverChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  coverChangeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  coverEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.md,
  },
  coverIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverHintTitle: {
    ...Typography.title,
    textAlign: 'center',
  },
  coverHintSubtext: {
    ...Typography.caption,
    textAlign: 'center',
  },
  skipText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Preview step
  previewReadyText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  previewCard: {
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  previewCoverWrapper: {
    position: 'relative',
  },
  previewCover: {
    width: '100%',
    height: 180,
  },
  previewCoverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  previewCoverPlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  previewTitle: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  previewDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewDestText: {
    ...Typography.bodySm,
    flex: 1,
  },
  previewDesc: {
    ...Typography.bodySm,
    lineHeight: 20,
  },
  previewPills: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Bottom bar — glassmorphism
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Glass.border,
    backgroundColor: Glass.bg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
