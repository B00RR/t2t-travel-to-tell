import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { BudgetEstimate, BudgetExpense } from '@/types/tripPlan';

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

  return (
    <View>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="wallet-outline" size={20} color="#34C759" />
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
            <Text style={[styles.summaryAmount, totalSpent > displayTotal && displayTotal > 0 && styles.overBudget]}>
              {fmt(totalSpent)} {currency}
            </Text>
          </View>
          {displayTotal > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('planner.budget_remaining')}</Text>
                <Text style={[styles.summaryAmount, totalSpent > displayTotal ? styles.overBudget : styles.underBudget]}>
                  {fmt(displayTotal - totalSpent)} {currency}
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
                <View style={styles.totalRight}>
                  <Text style={styles.totalAmount}>{fmt(displayTotal)} {currency}</Text>
                  {isOwner && (
                    <TouchableOpacity onPress={openEditEstimate} style={styles.editIconBtn}>
                      <Ionicons name="pencil-outline" size={16} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                </View>
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
              <Ionicons name="add" size={18} color="#fff" />
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
                      <Ionicons name={(cat?.icon ?? 'ellipsis-horizontal-outline') as any} size={16} color="#555" />
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
                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('planner.budget_edit')}</Text>
              <TouchableOpacity onPress={() => setEditingEstimate(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('planner.expense_add')}</Text>
              <TouchableOpacity onPress={() => setAddingExpense(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>{t('planner.budget_cat_label')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
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
            <View style={[styles.amountInput, { marginBottom: 16 }]}>
              <TextInput
                style={[styles.amountField, { flex: 1 }]}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#bbb"
                value={expenseForm.amount}
                onChangeText={v => setExpenseForm(p => ({ ...p, amount: v }))}
              />
              <Text style={styles.amountCurrency}>{currency}</Text>
            </View>
            <Text style={styles.fieldLabel}>{t('planner.expense_note')}</Text>
            <TextInput
              style={[styles.amountInput, { paddingVertical: 12, fontSize: 15, marginBottom: 20 }]}
              placeholder={t('planner.expense_note_placeholder')}
              placeholderTextColor="#bbb"
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
    marginBottom: 12,
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
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#f8fff8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d4f0d4',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#d4f0d4',
    marginHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  overBudget: {
    color: '#FF3B30',
  },
  underBudget: {
    color: '#34C759',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#1a1a1a',
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
  totalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  editIconBtn: {
    padding: 4,
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
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  addExpenseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  expenseList: {
    gap: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  expenseIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  deleteExpenseBtn: {
    padding: 4,
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
