import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, type AppTheme } from '@/hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/components/Toast';

export default function AddDayScreen() {
  const { t } = useTranslation();
  const { diary_id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [dateStr, setDateStr] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddDay() {
    if (!diary_id) return;
    setLoading(true);

    const { data: daysData, error: countError } = await supabase
      .from('diary_days')
      .select('day_number')
      .eq('diary_id', diary_id)
      .order('day_number', { ascending: false })
      .limit(1);

    if (countError) {
      toast.show({ message: t('diary.err_calc_day'), type: 'error' });
      setLoading(false);
      return;
    }

    const nextDayNumber = daysData && daysData.length > 0 ? daysData[0].day_number + 1 : 1;

    let parsedDate = null;
    if (dateStr) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const { error: insertError } = await supabase
      .from('diary_days')
      .insert({
        diary_id,
        day_number: nextDayNumber,
        title: title || t('diary.day_label', { number: nextDayNumber }),
        date: parsedDate || null,
        sort_order: nextDayNumber,
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      toast.show({ message: t('diary.err_add_day'), type: 'error' });
    } else {
      router.back();
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} disabled={loading}>
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('diary.new_day_title')}</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('diary.day_title_label')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('diary.day_title_placeholder')}
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('diary.date_label')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="calendar-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder={t('diary.date_placeholder')}
              placeholderTextColor={theme.textMuted}
              value={dateStr}
              onChangeText={setDateStr}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAddDay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('diary.add_to_diary')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.bgElevated,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
    },
    content: {
      padding: 24,
    },
    formGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: t.textMuted,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: t.bgSurface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: t.textPrimary,
      borderWidth: 1,
      borderColor: t.border,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.bgSurface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 16,
    },
    inputIcon: {
      marginRight: 10,
    },
    inputWithIcon: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 16,
      color: t.textPrimary,
    },
    button: {
      backgroundColor: t.teal,
      borderRadius: 16,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
  });
}