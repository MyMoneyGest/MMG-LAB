import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius } from '@/constants/theme';
import { parseAmountInput } from '@/lib/format';
import { useMoney } from '@/lib/use-money';
import { Button, Field, KeyboardSafeScrollView } from './ui';

// L'aide couvre les DEUX lignes du budget, pas seulement le variable : une
// personne qui ne sait pas estimer ses courses ne sait souvent pas davantage
// additionner loyer, factures et abonnements de tête.
//
// Chaque section remplit son champ, et une section laissée vide ne touche à
// rien : quelqu'un qui connaît déjà ses charges fixes ne doit pas les voir
// écrasées par un zéro parce qu'il venait estimer autre chose.

const FIXED_CATEGORIES = [
  { key: 'housing', label: 'Loyer ou prêt immobilier' },
  { key: 'utilities', label: 'Électricité, eau, gaz' },
  { key: 'telecom', label: 'Téléphone et internet' },
  { key: 'credits', label: 'Crédits et assurances' },
  { key: 'fixedOther', label: 'Autres charges fixes (abonnements…)' },
] as const;

const VARIABLE_CATEGORIES = [
  { key: 'food', label: 'Alimentation et courses' },
  { key: 'transport', label: 'Transport' },
  { key: 'health', label: 'Santé et soins' },
  { key: 'leisure', label: 'Loisirs et sorties' },
  { key: 'variableOther', label: 'Autres dépenses variables' },
] as const;

type ExpenseCategory = (typeof FIXED_CATEGORIES | typeof VARIABLE_CATEGORIES)[number];
type ExpenseKey = ExpenseCategory['key'];
type ExpenseValues = Record<ExpenseKey, string>;

const EMPTY_VALUES: ExpenseValues = [...FIXED_CATEGORIES, ...VARIABLE_CATEGORIES].reduce(
  (acc, { key }) => {
    acc[key] = '';
    return acc;
  },
  {} as ExpenseValues
);

/** Montant par section : `null` = section vide, donc champ laissé intact. */
export interface ExpenseEstimate {
  fixedCharges: number | null;
  variableExpenses: number | null;
}

export function ExpenseEstimateModal({
  visible,
  onApply,
  onClose,
}: {
  visible: boolean;
  onApply: (estimate: ExpenseEstimate) => void;
  onClose: () => void;
}) {
  const { currency, currencyCode, money, amountInput } = useMoney();
  const [values, setValues] = useState<ExpenseValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setError(null);
  }, [visible]);

  const summarize = useMemo(() => {
    const sectionTotal = (categories: readonly ExpenseCategory[]) => {
      const parsed = categories.map(({ key }) =>
        values[key] ? parseAmountInput(values[key], currencyCode) : 0
      );
      return {
        invalid: parsed.some((value) => value === null),
        filled: categories.some(({ key }) => values[key].trim() !== ''),
        total: parsed.reduce((sum: number, value) => sum + (value ?? 0), 0),
      };
    };
    return {
      fixed: sectionTotal(FIXED_CATEGORIES),
      variable: sectionTotal(VARIABLE_CATEGORIES),
    };
  }, [currencyCode, values]);

  const { fixed, variable } = summarize;
  const total = fixed.total + variable.total;

  const submit = () => {
    if (fixed.invalid || variable.invalid) {
      setError('Vérifie les montants saisis.');
      return;
    }
    if (total <= 0) {
      setError('Ajoute au moins une dépense pour obtenir une estimation.');
      return;
    }
    onApply({
      fixedCharges: fixed.filled ? fixed.total : null,
      variableExpenses: variable.filled ? variable.total : null,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardSafeScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={process.env.EXPO_OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable accessibilityViewIsModal style={styles.sheet} onPress={() => {}}>
              <Text style={styles.eyebrow}>Aide facultative</Text>
              <Text style={styles.title}>Estime tes dépenses du mois</Text>
              <Text style={styles.subtitle}>
                Remplis ce que tu connais. Une section laissée vide ne modifiera pas le
                montant déjà saisi sur l'écran précédent.
              </Text>

              {(
                [
                  {
                    key: 'fixed',
                    title: 'Charges fixes',
                    hint: 'Ce qui tombe chaque mois, quoi qu’il arrive.',
                    categories: FIXED_CATEGORIES,
                    section: fixed,
                  },
                  {
                    key: 'variable',
                    title: 'Dépenses variables',
                    hint: 'Ce qui change d’un mois à l’autre. Indique une moyenne.',
                    categories: VARIABLE_CATEGORIES,
                    section: variable,
                  },
                ] as const
              ).map(({ key, title, hint, categories, section }) => (
                <View key={key} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    {section.filled && !section.invalid ? (
                      <Text style={styles.sectionTotal}>{money(section.total)}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.sectionHint}>{hint}</Text>
                  <View style={styles.fields}>
                    {categories.map(({ key: categoryKey, label }) => (
                      <Field
                        key={categoryKey}
                        label={label}
                        value={values[categoryKey]}
                        onChangeText={(value) => {
                          setValues((current) => ({
                            ...current,
                            [categoryKey]: amountInput(value),
                          }));
                          setError(null);
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        suffix={currency.symbol}
                      />
                    ))}
                  </View>
                </View>
              ))}

              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Estimation mensuelle</Text>
                <Text selectable style={styles.totalValue}>{money(total)}</Text>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.buttons}>
                <Button label="Annuler" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                <Button label="Utiliser ces montants" onPress={submit} style={{ flex: 1 }} />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardSafeScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 20,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  section: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionTotal: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 3 },
  fields: { marginTop: 12 },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  totalLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', flex: 1 },
  totalValue: { color: colors.accent, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  error: { color: colors.accent, fontSize: 14, fontWeight: '600', marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
