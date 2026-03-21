import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DayEntry } from '@/types/dayEntry';
import { RichTextInput } from './RichTextInput';

interface EditEntryModalProps {
  entry: DayEntry | null;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

export function EditEntryModal({
  entry, value, onChangeText, onSave, onClose, saving,
}: EditEntryModalProps) {
  const { t } = useTranslation();
  const typeLabel =
    entry?.type === 'tip' ? t('day.type_tip')
    : entry?.type === 'location' ? t('day.type_location')
    : t('day.type_text');

  return (
    <Modal visible={!!entry} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('day.edit_title', { type: typeLabel })}</Text>
          {entry?.type === 'text' ? (
            <RichTextInput
              value={value}
              onChangeText={onChangeText}
              autoFocus
            />
          ) : (
            <TextInput
              style={styles.input}
              multiline={entry?.type !== 'location'}
              value={value}
              onChangeText={onChangeText}
              autoFocus
              textAlignVertical="top"
            />
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 120,
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
