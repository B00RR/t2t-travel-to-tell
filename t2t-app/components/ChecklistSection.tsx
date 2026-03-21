import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ChecklistItem, ChecklistCategory } from '@/types/tripPlan';

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

  // Group by category
  const sections = CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      title: t(`planner.categories.${cat}`),
      data: items.filter(i => i.category === cat),
    }))
    .filter(s => s.data.length > 0 || (isOwner && s.category === addCategory && showAddForm));

  const checkedCount = items.filter(i => i.is_checked).length;

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
        <Text style={styles.progress}>{checkedCount}/{items.length}</Text>
      </View>

      {CATEGORY_ORDER.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        if (catItems.length === 0) return null;

        return (
          <View key={cat} style={styles.categoryGroup}>
            <View style={styles.categoryHeader}>
              <Ionicons name={CATEGORY_ICONS[cat] as any} size={15} color="#666" />
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
                  {item.is_checked && <Ionicons name="checkmark" size={14} color="#fff" />}
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
                    <Ionicons name="close-circle-outline" size={18} color="#ccc" />
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
              placeholderTextColor="#bbb"
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
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addItemText}>{t('planner.add_item')}</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  progress: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700',
  },
  categoryGroup: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  checkLabelDone: {
    textDecorationLine: 'line-through',
    color: '#bbb',
  },
  deleteBtn: {
    marginLeft: 4,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  addItemText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  addForm: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
  },
  addInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
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
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  catChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  catChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  catChipTextSelected: {
    color: '#fff',
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
    borderColor: '#ddd',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  addBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
