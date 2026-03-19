import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

type AddableType = 'text' | 'tip' | 'location';

interface AddEntryFormProps {
  type: AddableType;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

const CONFIG: Record<AddableType, { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; placeholder: string }> = {
  text: {
    icon: 'document-text',
    color: '#007AFF',
    title: 'Nuovo Testo',
    placeholder: 'Racconta cosa hai vissuto...',
  },
  tip: {
    icon: 'bulb',
    color: '#FF9500',
    title: 'Nuovo Consiglio',
    placeholder: 'Es. Prendete il biglietto cumulativo!',
  },
  location: {
    icon: 'location',
    color: '#FF3B30',
    title: 'Nuovo Luogo',
    placeholder: 'Es. Colosseo, Roma',
  },
};

export function AddEntryForm({ type, value, onChangeText, onSave, onCancel, saving }: AddEntryFormProps) {
  const { t } = useTranslation();
  const cfg = CONFIG[type];

  const title = t(`day.new_${type}`);
  const placeholder = t(`day.placeholder_${type}`);

  return (
    <View style={[styles.form, type === 'tip' && styles.formTip, type === 'location' && styles.formLocation]}>
      <View style={styles.header}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <TextInput
        style={[styles.input, type === 'location' && { minHeight: 48 }]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        multiline={type !== 'location'}
        numberOfLines={type === 'location' ? 1 : 4}
        textAlignVertical="top"
        autoFocus
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !value.trim() && styles.saveBtnDisabled]}
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
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  formTip: {
    backgroundColor: '#fff8ed',
    borderColor: '#FF9500',
  },
  formLocation: {
    backgroundColor: '#fff0f0',
    borderColor: '#FF3B30',
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
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 100,
    lineHeight: 22,
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
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});
