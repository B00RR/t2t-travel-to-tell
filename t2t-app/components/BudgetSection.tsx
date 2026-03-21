import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { BudgetEstimate } from '@/types/tripPlan';

const BUDGET_CATEGORIES = [
  { key: 'transport', icon: 'airplane-outline' },
  { key: 'accommodation', icon: 'bed-outline' },
  { key: 'food', icon: 'restaurant-outline' },
  { key: 'activities', icon: 'bicycle-outline' },
  { key: 'other', icon: 'ellipsis-horizontal-outline' },
] as const;

const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

interface BudgetSectionProps {
  budget: BudgetEstimate;
  isOwner: boolean;
  onUpdate: (budget: BudgetEstimate) => Promise<boolean>;
}

export function BudgetSection({ budget, isOwner, onUpdate }: BudgetSectionProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BudgetEstimate>({});

  const currency = budget.currency || 'EUR';
  const breakdown = budget.breakdown || {};
  const computedTotal = Object.values(breakdown).reduce((sum, v) => sum + (v || 0), 0);
  const displayTotal = budget.total ?? computedTotal;

  const hasData = displayTotal > 0 || Object.keys(breakdown).length > 0;

  function openEdit() {
    setDraft({
      currency: budget.currency || 'EUR',
      breakdown: { ...budget.breakdown },
      total: budget.total,
    });
    setEditing(true);
  }

  function setCategory(key: string, value: string) {
    const num = parseFloat(value.replace(',', '.'));
    setDraft(prev => ({
      ...prev,
      breakdown: {
        ...prev.breakdown,
        [key]: isNaN(num) ? 0 : num,
      },
    }));
  }

  async function handleSave() {
    const breakdown = draft.breakdown || {};
    const computed = Object.values(breakdown).reduce((s, v) => s + (v || 0), 0);
    const toSave: BudgetEstimate = {
      currency: draft.currency || 'EUR',
      breakdown,
      total: computed > 0 ? computed : undefined,
    };
    const ok = await onUpdate(toSave);
    if (ok) setEditing(false);
  }

  const draftTotal = Object.values(draft.breakdown || {}).reduce((s, v) => s + (v || 0), 0);

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="wallet-outline" size={20} color="#34C759" />
          <Text style={styles.sectionTitle}>{t('planner.budget')}</Text>
        </View>
        {isOwner && (
          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Ionicons name="pencil-outline" size={15} color="#007AFF" />
            <Text style={styles.editBtnText}>{t('planner.budget_edit')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!hasData ? (
        isOwner ? (
          <TouchableOpacity style={styles.emptyBudgetBtn} onPress={openEdit}>
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.emptyBudgetText}>{t('planner.budget_add')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noBudgetText}>{t('planner.budget_empty')}</Text>
        )
      ) : (
        <View style={styles.budgetCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('planner.budget_total')}</Text>
            <Text style={styles.totalAmount}>
              {displayTotal.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {currency}
            </Text>
          </View>
          {Object.keys(breakdown).length > 0 && (
            <View style={styles.breakdown}>
              {BUDGET_CATEGORIES.filter(c => breakdown[c.key] && breakdown[c.key]! > 0).map(cat => (
                <View key={cat.key} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <Ionicons name={cat.icon as any} size={15} color="#666" />
                    <Text style={styles.breakdownLabel}>{t(`planner.budget_cat_${cat.key}`)}</Text>
                  </View>
                  <Text style={styles.breakdownAmount}>
                    {(breakdown[cat.key] || 0).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {currency}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Edit Modal */}
      <Modal visible={editing} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('planner.budget_edit')}</Text>
              <TouchableOpacity onPress={() => setEditing(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Currency */}
              <Text style={styles.fieldLabel}>{t('planner.budget_currency')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={styles.currencyRow}>
                  {CURRENCIES.map(cur => (
                    <TouchableOpacity
                      key={cur}
                      style={[styles.currencyChip, draft.currency === cur && styles.currencyChipActive]}
                      onPress={() => setDraft(prev => ({ ...prev, currency: cur }))}
                    >
                      <Text style={[styles.currencyChipText, draft.currency === cur && styles.currencyChipTextActive]}>
                        {cur}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Category inputs */}
              <Text style={styles.fieldLabel}>{t('planner.budget_breakdown')}</Text>
              {BUDGET_CATEGORIES.map(cat => (
                <View key={cat.key} style={styles.categoryRow}>
                  <View style={styles.categoryLabel}>
                    <Ionicons name={cat.icon as any} size={18} color="#666" />
                    <Text style={styles.categoryLabelText}>{t(`planner.budget_cat_${cat.key}`)}</Text>
                  </View>
                  <View style={styles.amountInput}>
                    <TextInput
                      style={styles.amountField}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#bbb"
                      value={draft.breakdown?.[cat.key] ? String(draft.breakdown[cat.key]) : ''}
                      onChangeText={val => setCategory(cat.key, val)}
                    />
                    <Text style={styles.amountCurrency}>{draft.currency || 'EUR'}</Text>
                  </View>
                </View>
              ))}

              {/* Computed total */}
              {draftTotal > 0 && (
                <View style={styles.draftTotalRow}>
                  <Text style={styles.draftTotalLabel}>{t('planner.budget_total')}</Text>
                  <Text style={styles.draftTotalAmount}>
                    {draftTotal.toLocaleString('it-IT', { minimumFractionDigits: 0 })} {draft.currency || 'EUR'}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
  },
  editBtnText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    backgroundColor: '#f5f9ff',
  },
  emptyBudgetText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  noBudgetText: {
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  budgetCard: {
    backgroundColor: '#f8fff8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4f0d4',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  breakdown: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#d4f0d4',
    paddingTop: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#555',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currencyChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  currencyChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  currencyChipTextActive: {
    color: '#fff',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryLabelText: {
    fontSize: 15,
    color: '#333',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    minWidth: 110,
  },
  amountField: {
    fontSize: 15,
    color: '#1a1a1a',
    minWidth: 60,
    textAlign: 'right',
  },
  amountCurrency: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  draftTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  draftTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
  },
  draftTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2e7d32',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
