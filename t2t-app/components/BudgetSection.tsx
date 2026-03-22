import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { BudgetEstimate, BudgetExpense } from '@/types/tripPlan';
import { Palette } from '@/constants/theme';

const BUDGET_CATEGORIES = [
  { key: 'transport', icon: 'airplane-outline' },
  { key: 'accommodation', icon: 'bed-outline' },
  { key: 'food', icon: 'restaurant-outline' },
  { key: 'activities', icon: 'bicycle-outline' },
  { key: 'other', icon: 'ellipsis-horizontal-outline' },
] as const;

const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

type Tab = 'estimated' | 'expenses';

interface BudgetSectionProps {
  budget: BudgetEstimate;
  isOwner: boolean;
  onUpdate: (budget: BudgetEstimate) => Promise<boolean>;
}

export function BudgetSection({ budget, isOwner, onUpdate }: BudgetSectionProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'it' ? 'it-IT' : 'en-US';
  const [tab, setTab] = useState<Tab>('estimated');
  const [editingEstimate, setEditingEstimate] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [draft, setDraft] = useState<BudgetEstimate>({});
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'other', note: '' });

  const currency = budget.currency || 'EUR';
  const breakdown = budget.breakdown || {};
  const expenses = budget.expenses || [];
  const computedTotal = Object.values(breakdown).reduce((sum, v) => sum + (v || 0), 0);
  const displayTotal = budget.total ?? computedTotal;
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const hasEstimate = displayTotal > 0 || Object.keys(breakdown).length > 0;

  function openEditEstimate() {
    setDraft({
      currency: budget.currency || 'EUR',
      breakdown: { ...budget.breakdown },
      total: budget.total,
    });
    setEditingEstimate(true);
  }

  function setCategory(key: string, value: string) {
    const num = parseFloat(value.replace(',', '.'));
    setDraft(prev => ({
      ...prev,
      breakdown: { ...prev.breakdown, [key]: isNaN(num) ? 0 : num },
    }));
  }

  async function handleSaveEstimate() {
    const bd = draft.breakdown || {};
    const computed = Object.values(bd).reduce((s, v) => s + (v || 0), 0);
    const toSave: BudgetEstimate = {
      currency: draft.currency || 'EUR',
      breakdown: bd,
      total: computed > 0 ? computed : undefined,
      expenses: budget.expenses,
    };
    const ok = await onUpdate(toSave);
    if (ok) setEditingEstimate(false);
  }

  async function handleAddExpense() {
    const amount = parseFloat(expenseForm.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;
    const newExpense: BudgetExpense = {
      id: crypto.randomUUID(),
      amount,
      category: expenseForm.category,
      note: expenseForm.note.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    const updated: BudgetEstimate = {
      ...budget,
      expenses: [...expenses, newExpense],
    };
    const ok = await onUpdate(updated);
    if (ok) {
      setExpenseForm({ amount: '', category: 'other', note: '' });
      setAddingExpense(false);
    }
  }

  function handleDeleteExpense(id: string) {
    Alert.alert(
      t('planner.expense_delete_title'),
      t('planner.expense_delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updated: BudgetEstimate = {
              ...budget,
              expenses: expenses.filter(e => e.id !== id),
            };
            await onUpdate(updated);
          },
        },
      ]
    );
  }

  const draftTotal = Object.values(draft.breakdown || {}).reduce((s, v) => s + (v || 0), 0);

  const fmt = useCallback((n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    [locale]
  );

  const remainingAmount = displayTotal - totalSpent;
  const isOverBudget = totalSpent > displayTotal && displayTotal > 0;

  return (
    <View>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <View style={styles.sectionIconBg}>
            <Ionicons name="wallet-outline" size={18} color={Palette.teal} />
          </View>
          <Text style={styles.sectionTitle}>{t('planner.budget')}</Text>
        </View>
      </View>

      {/* Summary bar */}
      {(hasEstimate || expenses.length > 0) && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('planner.budget_estimated')}</Text>
            <Text style={styles.summaryAmount}>{fmt(displayTotal)} {currency}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('planner.budget_spent')}</Text>
            <Text style={[styles.summaryAmount, isOverBudget && styles.overBudget]}>
              {fmt(totalSpent)} {currency}
            </Text>
          </View>
          {displayTotal > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('planner.budget_remaining')}</Text>
                <Text style={[styles.summaryAmount, isOverBudget ? styles.overBudget : styles.underBudget]}>
                  {fmt(remainingAmount)} {currency}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'estimated' && styles.tabBtnActive]}
          onPress={() => setTab('estimated')}
        >
          <Text style={[styles.tabText, tab === 'estimated' && styles.tabTextActive]}>
            {t('planner.budget_tab_estimated')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'expenses' && styles.tabBtnActive]}
          onPress={() => setTab('expenses')}
        >
          <Text style={[styles.tabText, tab === 'expenses' && styles.tabTextActive]}>
            {t('planner.budget_tab_expenses')} {expenses.length > 0 ? `(${expenses.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ESTIMATED TAB */}
      {tab === 'estimated' && (
        <>
          {!hasEstimate ? (
            isOwner ? (
              <TouchableOpacity style={styles.emptyBudgetBtn} onPress={openEditEstimate}>
                <Ionicons name="add-circle-outline" size={20} color={Palette.teal} />
                <Text style={styles.emptyBudgetText}>{t('planner.budget_add')}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noBudgetText}>{t('planner.budget_empty')}</Text>
            )
          ) : (
            <View style={styles.budgetCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('planner.budget_total')}</Text>
                <View style={styles.totalRight}>
                  <Text style={styles.totalAmount}>{fmt(displayTotal)} {currency}</Text>
                  {isOwner && (
                    <TouchableOpacity onPress={openEditEstimate} style={styles.editIconBtn}>
                      <Ionicons name="pencil-outline" size={16} color={Palette.teal} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {Object.keys(breakdown).length > 0 && (
                <View style={styles.breakdown}>
                  {BUDGET_CATEGORIES.filter(c => breakdown[c.key] && breakdown[c.key]! > 0).map(cat => (
                    <View key={cat.key} style={styles.breakdownRow}>
                      <View style={styles.breakdownLeft}>
                        <View style={styles.catIconBg}>
                          <Ionicons name={cat.icon as any} size={13} color={Palette.textSecondary} />
                        </View>
                        <Text style={styles.breakdownLabel}>{t(`planner.budget_cat_${cat.key}`)}</Text>
                      </View>
                      <Text style={styles.breakdownAmount}>
                        {fmt(breakdown[cat.key] || 0)} {currency}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* EXPENSES TAB */}
      {tab === 'expenses' && (
        <>
          {isOwner && (
            <TouchableOpacity style={styles.addExpenseBtn} onPress={() => setAddingExpense(true)}>
              <Ionicons name="add" size={18} color={Palette.bgPrimary} />
              <Text style={styles.addExpenseBtnText}>{t('planner.expense_add')}</Text>
            </TouchableOpacity>
          )}
          {expenses.length === 0 ? (
            <Text style={styles.noBudgetText}>{t('planner.expense_empty')}</Text>
          ) : (
            <View style={styles.expenseList}>
              {expenses.map(exp => {
                const cat = BUDGET_CATEGORIES.find(c => c.key === exp.category);
                return (
                  <View key={exp.id} style={styles.expenseRow}>
                    <View style={styles.expenseIconWrap}>
                      <Ionicons name={(cat?.icon ?? 'ellipsis-horizontal-outline') as any} size={15} color={Palette.textSecondary} />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseNote} numberOfLines={1}>
                        {exp.note || t(`planner.budget_cat_${exp.category}`)}
                      </Text>
                      <Text style={styles.expenseDate}>{exp.date}</Text>
                    </View>
                    <Text style={styles.expenseAmount}>{fmt(exp.amount)} {currency}</Text>
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => handleDeleteExpense(exp.id)}
                        style={styles.deleteExpenseBtn}
                      >
                        <Ionicons name="trash-outline" size={15} color={Palette.red} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* Edit Estimate Modal */}
      <Modal visible={editingEstimate} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('planner.budget_edit')}</Text>
              <TouchableOpacity onPress={() => setEditingEstimate(false)}>
                <Ionicons name="close" size={22} color={Palette.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>{t('planner.budget_currency')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
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
              <Text style={styles.fieldLabel}>{t('planner.budget_breakdown')}</Text>
              {BUDGET_CATEGORIES.map(cat => (
                <View key={cat.key} style={styles.categoryRow}>
                  <View style={styles.categoryLabel}>
                    <View style={styles.catIconBg}>
                      <Ionicons name={cat.icon as any} size={15} color={Palette.textSecondary} />
                    </View>
                    <Text style={styles.categoryLabelText}>{t(`planner.budget_cat_${cat.key}`)}</Text>
                  </View>
                  <View style={styles.amountInput}>
                    <TextInput
                      style={styles.amountField}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Palette.textMuted}
                      value={draft.breakdown?.[cat.key] ? String(draft.breakdown[cat.key]) : ''}
                      onChangeText={val => setCategory(cat.key, val)}
                    />
                    <Text style={styles.amountCurrency}>{draft.currency || 'EUR'}</Text>
                  </View>
                </View>
              ))}
              {draftTotal > 0 && (
                <View style={styles.draftTotalRow}>
                  <Text style={styles.draftTotalLabel}>{t('planner.budget_total')}</Text>
                  <Text style={styles.draftTotalAmount}>
                    {fmt(draftTotal)} {draft.currency || 'EUR'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEstimate}>
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={addingExpense} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('planner.expense_add')}</Text>
              <TouchableOpacity onPress={() => setAddingExpense(false)}>
                <Ionicons name="close" size={22} color={Palette.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>{t('planner.budget_cat_label')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={styles.currencyRow}>
                {BUDGET_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.currencyChip, expenseForm.category === cat.key && styles.currencyChipActive]}
                    onPress={() => setExpenseForm(p => ({ ...p, category: cat.key }))}
                  >
                    <Text style={[styles.currencyChipText, expenseForm.category === cat.key && styles.currencyChipTextActive]}>
                      {t(`planner.budget_cat_${cat.key}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.fieldLabel}>{t('planner.expense_amount')}</Text>
            <View style={[styles.amountInput, { marginBottom: 20 }]}>
              <TextInput
                style={[styles.amountField, { flex: 1 }]}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Palette.textMuted}
                value={expenseForm.amount}
                onChangeText={v => setExpenseForm(p => ({ ...p, amount: v }))}
              />
              <Text style={styles.amountCurrency}>{currency}</Text>
            </View>
            <Text style={styles.fieldLabel}>{t('planner.expense_note')}</Text>
            <TextInput
              style={[styles.amountInput, { paddingVertical: 12, fontSize: 15, marginBottom: 24, color: Palette.textPrimary }]}
              placeholder={t('planner.expense_note_placeholder')}
              placeholderTextColor={Palette.textMuted}
              value={expenseForm.note}
              onChangeText={v => setExpenseForm(p => ({ ...p, note: v }))}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddExpense}>
              <Text style={styles.saveBtnText}>{t('planner.expense_save')}</Text>
            </TouchableOpacity>
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
    gap: 10,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,201,167,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Palette.bgElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Palette.border,
    marginHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: Palette.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  overBudget: {
    color: Palette.red,
  },
  underBudget: {
    color: Palette.teal,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Palette.bgElevated,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: Palette.bgSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  tabTextActive: {
    color: Palette.textPrimary,
  },
  emptyBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,201,167,0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,201,167,0.05)',
  },
  emptyBudgetText: {
    color: Palette.teal,
    fontWeight: '600',
    fontSize: 15,
  },
  noBudgetText: {
    color: Palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  budgetCard: {
    backgroundColor: Palette.bgElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: Palette.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  totalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.teal,
  },
  editIconBtn: {
    padding: 4,
  },
  catIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Palette.bgSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdown: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
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
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.teal,
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 12,
  },
  addExpenseBtnText: {
    color: Palette.bgPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  expenseList: {
    gap: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.bgElevated,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  expenseIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.bgSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseNote: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  expenseDate: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  deleteExpenseBtn: {
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Palette.bgSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Palette.border,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    alignSelf: 'center',
    marginBottom: 20,
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
    color: Palette.textPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: Palette.bgElevated,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  currencyChipActive: {
    backgroundColor: Palette.teal,
    borderColor: Palette.teal,
  },
  currencyChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  currencyChipTextActive: {
    color: Palette.bgPrimary,
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
    gap: 10,
    flex: 1,
  },
  categoryLabelText: {
    fontSize: 15,
    color: Palette.textSecondary,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    minWidth: 110,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  amountField: {
    fontSize: 15,
    color: Palette.textPrimary,
    minWidth: 60,
    textAlign: 'right',
  },
  amountCurrency: {
    fontSize: 13,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  draftTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,201,167,0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,201,167,0.25)',
  },
  draftTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.teal,
  },
  draftTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.teal,
  },
  saveBtn: {
    backgroundColor: Palette.teal,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveBtnText: {
    color: Palette.bgPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
