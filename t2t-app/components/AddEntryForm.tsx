import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { RichTextInput } from './RichTextInput';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';

type AddableType = 'text' | 'tip' | 'location';

interface AddEntryFormProps {
  type: AddableType;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

const ICON_MAP: Record<AddableType, keyof typeof Ionicons.glyphMap> = {
  text: 'document-text',
  tip: 'bulb',
  location: 'location',
};

export function AddEntryForm({ type, value, onChangeText, onSave, onCancel, saving }: AddEntryFormProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const accentColor = type === 'text' ? theme.teal : type === 'tip' ? theme.orange : theme.red;
  const title = t(`day.new_${type}`);
  const placeholder = t(`day.placeholder_${type}`);

  return (
    <View style={[styles.form, { backgroundColor: `${accentColor}10`, borderColor: accentColor }]}>
      <View style={styles.header}>
        <Ionicons name={ICON_MAP[type]} size={20} color={accentColor} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      </View>
      {type === 'text' ? (
        <RichTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          autoFocus
        />
      ) : (
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgSurface, borderColor: accentColor, color: theme.textPrimary }, type === 'location' && { minHeight: 48 }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={onChangeText}
          multiline={type !== 'location'}
          numberOfLines={type === 'location' ? 1 : 4}
          textAlignVertical="top"
          autoFocus
        />
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={[styles.cancelText, { color: theme.textMuted }]}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: accentColor }, (!value.trim() || saving) && styles.saveBtnDisabled]}
          disabled={!value.trim() || saving}
          onPress={onSave}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveText}>{t('common.save')}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    borderRadius: Radius.md,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    borderRadius: Radius.sm,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    lineHeight: 22,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});
