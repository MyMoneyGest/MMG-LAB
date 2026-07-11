import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Button, Card, Eyebrow, Field, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { formatEuro, parseAmountInput } from '@/lib/format';
import { prudentCapacity, resteAVivre, SAFETY_MARGIN } from '@/lib/plan';
import { useStore } from '@/lib/store';

export default function BudgetScreen() {
  const router = useRouter();
  const budget = useStore((s) => s.budget);
  const goals = useStore((s) => s.goals);
  const setBudget = useStore((s) => s.setBudget);

  const [income, setIncome] = useState(budget ? String(budget.income) : '');
  const [fixed, setFixed] = useState(budget ? String(budget.fixedCharges) : '');
  const [variable, setVariable] = useState(budget ? String(budget.variableExpenses) : '');
  const [error, setError] = useState<string | null>(null);

  const parsed = {
    income: parseAmountInput(income),
    fixedCharges: parseAmountInput(fixed),
    variableExpenses: parseAmountInput(variable),
  };
  const complete =
    parsed.income !== null && parsed.fixedCharges !== null && parsed.variableExpenses !== null;
  const draft = complete
    ? { income: parsed.income!, fixedCharges: parsed.fixedCharges!, variableExpenses: parsed.variableExpenses! }
    : null;

  const save = () => {
    if (!draft) {
      setError('Complète les trois montants pour estimer ta capacité.');
      return;
    }
    setBudget(draft);
    if (goals.length === 0) router.push('/onboarding/new-goal');
    else router.back();
  };

  return (
    <Screen>
      <AppHeader showBack />
      <Card>
        <Eyebrow>Ton budget</Eyebrow>
        <Text style={styles.title}>Combien peux-tu mettre de côté sans te serrer ?</Text>
        <Text style={styles.body}>
          Trois ordres de grandeur suffisent. Pas besoin d'être exact, tu pourras ajuster.
        </Text>

        <Field
          label="Revenus nets par mois"
          value={income}
          onChangeText={(t) => {
            setIncome(t);
            setError(null);
          }}
          keyboardType="decimal-pad"
          placeholder="2 000"
          suffix="EUR"
        />
        <Field
          label="Charges fixes (loyer, abonnements, crédits…)"
          value={fixed}
          onChangeText={(t) => {
            setFixed(t);
            setError(null);
          }}
          keyboardType="decimal-pad"
          placeholder="900"
          suffix="EUR"
        />
        <Field
          label="Dépenses variables (courses, sorties…)"
          value={variable}
          onChangeText={(t) => {
            setVariable(t);
            setError(null);
          }}
          keyboardType="decimal-pad"
          placeholder="500"
          suffix="EUR"
        />

        {draft ? (
          <Text style={styles.capacity}>Capacité prudente : {formatEuro(prudentCapacity(draft))} / mois</Text>
        ) : null}
        {draft ? (
          <Text style={styles.capacityNote}>
            Reste à vivre {formatEuro(resteAVivre(draft))}, moins une marge de sécurité de{' '}
            {Math.round(SAFETY_MARGIN * 100)} % pour éviter un plan trop serré.
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Continuer" onPress={save} style={{ marginTop: 16 }} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.text, lineHeight: 37, marginBottom: 10 },
  body: { fontSize: 16, color: colors.textSecondary, lineHeight: 23, marginBottom: 20 },
  capacity: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.accent,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    paddingVertical: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
    marginTop: 4,
  },
  capacityNote: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 10 },
  error: { color: colors.accent, fontSize: 15, fontWeight: '600', marginTop: 10 },
});
