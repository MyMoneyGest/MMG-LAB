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

const EXPENSE_CATEGORIES = [
  { key: 'food', label: 'Alimentation et courses' },
  { key: 'transport', label: 'Transport' },
  { key: 'health', label: 'Santé et soins' },
  { key: 'leisure', label: 'Loisirs et sorties' },
  { key: 'other', label: 'Autres dépenses variables' },
] as const;

type ExpenseKey = (typeof EXPENSE_CATEGORIES)[number]['key'];
type ExpenseValues = Record<ExpenseKey, string>;

const EMPTY_VALUES: ExpenseValues = {
  food: '',
  transport: '',
  health: '',
  leisure: '',
  other: '',
};

export function ExpenseEstimateModal({
  visible,
  onApply,
  onClose,
}: {
  visible: boolean;
  onApply: (total: number) => void;
  onClose: () => void;
}) {
  const { currency, currencyCode, money, amountInput } = useMoney();
  const [values, setValues] = useState<ExpenseValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setError(null);
  }, [visible]);

  const parsedValues = useMemo(
    () =>
      EXPENSE_CATEGORIES.map(({ key }) => ({
        key,
        value: values[key] ? parseAmountInput(values[key], currencyCode) : 0,
      })),
    [currencyCode, values]
  );
  const invalid = parsedValues.some(({ value }) => value === null);
  const total = parsedValues.reduce((sum, { value }) => sum + (value ?? 0), 0);

  const submit = () => {
    if (invalid) {
      setError('Vérifie les montants saisis.');
      return;
    }
    if (total <= 0) {
      setError('Ajoute au moins une dépense pour obtenir une estimation.');
      return;
    }
    onApply(total);
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
                Indique une moyenne. Ne recompte pas le loyer, les crédits ou les abonnements
                déjà inclus dans tes charges fixes.
              </Text>

              <View style={styles.fields}>
                {EXPENSE_CATEGORIES.map(({ key, label }) => (
                  <Field
                    key={key}
                    label={label}
                    value={values[key]}
                    onChangeText={(value) => {
                      setValues((current) => ({ ...current, [key]: amountInput(value) }));
                      setError(null);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    suffix={currency.symbol}
                  />
                ))}
              </View>

              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Estimation mensuelle</Text>
                <Text selectable style={styles.totalValue}>{money(total)}</Text>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.buttons}>
                <Button label="Annuler" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                <Button label="Utiliser ce total" onPress={submit} style={{ flex: 1 }} />
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
  fields: { marginTop: 14 },
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
