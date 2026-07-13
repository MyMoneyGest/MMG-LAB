import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { RebalanceModal } from '@/components/rebalance-modal';
import { Button, Card, Field, Screen, StepIndicator } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import {
  applyGlobalRebalance,
  clearGlobalRebalanceReview,
  deferGlobalRebalance,
} from '@/lib/actions';
import { formatEuro, parseAmountInput } from '@/lib/format';
import {
  buildGlobalRebalanceProposal,
  prudentCapacity,
  resteAVivre,
  SAFETY_MARGIN,
} from '@/lib/plan';
import type { GlobalRebalanceProposal } from '@/lib/plan';
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
  const [rebalanceProposal, setRebalanceProposal] =
    useState<GlobalRebalanceProposal | null>(null);

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
    if (goals.length === 0) {
      clearGlobalRebalanceReview();
      router.push('/onboarding/new-goal');
      return;
    }
    const proposal = buildGlobalRebalanceProposal(goals, draft);
    if (!proposal.goals.length && proposal.possible) {
      clearGlobalRebalanceReview();
      router.back();
      return;
    }
    setRebalanceProposal(proposal);
  };

  return (
    <Screen>
      <AppHeader showBack title="Ton budget" subtitle="Étape 1 sur 3" />
      <StepIndicator current={1} />
      <Card>
        <Text style={styles.title}>Combien peux-tu mettre de côté sans te serrer ?</Text>
        <Text style={styles.body}>
          Trois ordres de grandeur suffisent. Les revenus correspondent au total mensuel que
          tu considères comme disponible, pas aux entrées d'un compte bancaire particulier.
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
        <View style={styles.checks}>
          <Text style={styles.check}>✓ Ton reste après les dépenses du quotidien</Text>
          <Text style={styles.check}>✓ Une marge de sécurité de 20 %</Text>
          <Text style={styles.check}>✓ L'effort cumulé de tous tes projets</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Continuer" onPress={save} style={{ marginTop: 16 }} />
      </Card>
      <RebalanceModal
        proposal={rebalanceProposal}
        reason="budget"
        onKeep={() => {
          deferGlobalRebalance('budget');
          setRebalanceProposal(null);
          router.back();
        }}
        onApply={async () => {
          if (!rebalanceProposal) return;
          await applyGlobalRebalance(rebalanceProposal);
          setRebalanceProposal(null);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 25, fontWeight: '800', color: colors.text, lineHeight: 31, marginBottom: 8 },
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
  checks: { gap: 7, marginTop: 18, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  check: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  error: { color: colors.accent, fontSize: 15, fontWeight: '600', marginTop: 10 },
});
