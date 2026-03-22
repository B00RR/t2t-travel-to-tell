import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ChecklistItem, ChecklistCategory } from '@/types/tripPlan';
import { Palette } from '@/constants/theme';

const CATEGORY_ORDER: ChecklistCategory[] = ['documents', 'gear', 'accommodation', 'transport', 'general'];
const CATEGORY_ICONS: Record<ChecklistCategory, string> = {
  documents: 'document-text-outline',
  gear: 'briefcase-outline',
  accommodation: 'bed-outline',
  transport: 'car-outline',
  general: 'checkmark-circle-outline',
};

interface ChecklistSectionProps {
  items: ChecklistItem[];
  isOwner: boolean;
  onToggle: (itemId: string) => void;
  onAdd?: (label: string, category: ChecklistCategory) => void;
  onDelete?: (itemId: string) => void;
}

export function ChecklistSection({ items, isOwner, onToggle, onAdd, onDelete }: ChecklistSectionProps) {
  const { t } = useTranslation();
  const [addLabel, setAddLabel] = useState('');
  const [addCategory, setAddCategory] = useState<ChecklistCategory>('general');
  const [showAddForm, setShowAddForm] = useState(false);

  const checkedCount = items.filter(i => i.is_checked).length;
  const progressPct = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  function handleAdd() {
    if (!addLabel.trim()) return;
    onAdd?.(addLabel.trim(), addCategory);
    setAddLabel('');
    setShowAddForm(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('planner.checklist')}</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{checkedCount}/{items.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      {items.length > 0 && (
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
      )}

      {CATEGORY_ORDER.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        if (catItems.length === 0) return null;

        return (
          <View key={cat} style={styles.categoryGroup}>
            <View style={styles.categoryHeader}>
              <Ionicons name={CATEGORY_ICONS[cat] as any} size={13} color={Palette.textMuted} />
              <Text style={styles.categoryLabel}>{t(`planner.categories.${cat}`)}</Text>
            </View>

            {catItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.checkRow}
                onPress={() => onToggle(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
                  {item.is_checked && <Ionicons name="checkmark" size={13} color={Palette.bgPrimary} />}
                </View>
                <Text style={[styles.checkLabel, item.is_checked && styles.checkLabelDone]}>
                  {item.label}
                </Text>
                {isOwner && onDelete && (
                  <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="close-circle-outline" size={17} color={Palette.textMuted} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );
      })}

      {isOwner && (
        showAddForm ? (
          <View style={styles.addForm}>
            <TextInput
              style={styles.addInput}
              value={addLabel}
              onChangeText={setAddLabel}
              placeholder={t('planner.add_item_placeholder')}
              placeholderTextColor={Palette.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            {/* Category selector */}
            <View style={styles.categoryPicker}>
              {CATEGORY_ORDER.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, addCategory === cat && styles.catChipSelected]}
                  onPress={() => setAddCategory(cat)}
                >
                  <Text style={[styles.catChipText, addCategory === cat && styles.catChipTextSelected]}>
                    {t(`planner.categories.${cat}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addActions}>
              <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                <Text style={styles.addBtnText}>{t('planner.add_item')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addItemRow} onPress={() => setShowAddForm(true)}>
            <Ionicons name="add-circle-outline" size={19} color={Palette.teal} />
            <Text style={styles.addItemText}>{t('planner.add_item')}</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.bgElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  progressBadge: {
    backgroundColor: 'rgba(0,201,167,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,201,167,0.25)',
  },
  progressText: {
    fontSize: 13,
    color: Palette.teal,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Palette.bgSubtle,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Palette.teal,
    borderRadius: 2,
  },
  categoryGroup: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Palette.teal,
    borderColor: Palette.teal,
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    color: Palette.textPrimary,
  },
  checkLabelDone: {
    textDecorationLine: 'line-through',
    color: Palette.textMuted,
  },
  deleteBtn: {
    marginLeft: 4,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  addItemText: {
    fontSize: 15,
    color: Palette.teal,
    fontWeight: '600',
  },
  addForm: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 14,
  },
  addInput: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Palette.textPrimary,
    backgroundColor: Palette.bgSubtle,
    marginBottom: 10,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.bgSubtle,
  },
  catChipSelected: {
    backgroundColor: Palette.teal,
    borderColor: Palette.teal,
  },
  catChipText: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  catChipTextSelected: {
    color: Palette.bgPrimary,
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  cancelBtnText: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Palette.teal,
  },
  addBtnText: {
    fontSize: 14,
    color: Palette.bgPrimary,
    fontWeight: '700',
  },
});
