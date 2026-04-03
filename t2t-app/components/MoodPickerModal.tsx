import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';
import { MOODS } from '@/types/dayEntry';

interface MoodPickerModalProps {
  visible: boolean;
  onSelect: (emoji: string, label: string) => void;
  onClose: () => void;
}

export function MoodPickerModal({ visible, onSelect, onClose }: MoodPickerModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const getMoodKey = (label: string) => {
    switch (label) {
      case 'Fantastico': return 'fantastic';
      case 'Felice': return 'happy';
      case 'Rilassato': return 'relaxed';
      case 'Entusiasta': return 'excited';
      case 'Goloso': return 'hungry';
      case 'Stanco': return 'tired';
      case 'Frustrato': return 'frustrated';
      case 'Congelato': return 'frozen';
      case 'Sudato': return 'sweaty';
      case 'Malato': return 'sick';
      default: return 'happy';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.bgSurface }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('day.mood_question')}</Text>
          <View style={styles.grid}>
            {MOODS.map((m) => {
              const translatedLabel = t(`day.moods.${getMoodKey(m.label)}`);
              return (
                <TouchableOpacity
                  key={m.emoji}
                  style={[styles.option, { backgroundColor: theme.bgElevated }]}
                  onPress={() => onSelect(m.emoji, translatedLabel)}
                >
                  <Text style={styles.emoji}>{m.emoji}</Text>
                  <Text style={[styles.label, { color: theme.textMuted }]}>{translatedLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelText, { color: theme.textMuted }]}>{t('common.cancel')}</Text>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
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
    borderRadius: Radius.md,
  },
  emoji: { fontSize: 28 },
  label: {
    fontSize: 11,
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
    fontWeight: '600',
  },
});
