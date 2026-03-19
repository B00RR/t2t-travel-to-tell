import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MOODS } from '@/types/dayEntry';

interface MoodPickerModalProps {
  visible: boolean;
  onSelect: (emoji: string, label: string) => void;
  onClose: () => void;
}

export function MoodPickerModal({ visible, onSelect, onClose }: MoodPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Come ti senti oggi?</Text>
          <View style={styles.grid}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.emoji}
                style={styles.option}
                onPress={() => onSelect(m.emoji, m.label)}
              >
                <Text style={styles.emoji}>{m.emoji}</Text>
                <Text style={styles.label}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Annulla</Text>
          </TouchableOpacity>
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
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  option: {
    alignItems: 'center',
    width: 72,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  emoji: { fontSize: 28 },
  label: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
});
