import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionLoadingOverlay } from '@/components/action-loading-overlay';
import { AppHeader } from '@/components/app-header';
import { Button, Card, DateField, Field, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { changeReminderDay } from '@/lib/actions';
import { formatDate, formatEuro, parseAmountInput, parseDateInput } from '@/lib/format';
import {
  cyclesAfterReminderDayChange,
  nextReminderFromCycles,
  peakScheduledAmount,
  savedTotal,
  suggestedAmount,
} from '@/lib/plan';
import { scheduleGoalReminders } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import type { Goal, SavingsRhythm } from '@/lib/types';

const RHYTHMS: { key: SavingsRhythm; label: string }[] = [
  { key: 'stable', label: 'Stable' },
  { key: 'progressive', label: 'Progressif' },
  { key: 'regressive', label: 'Régressif' },
];

export default function AdjustGoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useStore((state) => state.goals.find((candidate) => candidate.id === id));
  const updateGoal = useStore((state) => state.updateGoal);

  const [target, setTarget] = useState(goal ? String(goal.targetAmount) : '');
  const [dateText, setDateText] = useState(goal ? formatDate(goal.targetDate) : '');
  const [reminderDayText, setReminderDayText] = useState(goal ? String(goal.reminderDay) : '');
  const [rhythm, setRhythm] = useState<SavingsRhythm>(goal?.rhythm ?? 'stable');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!goal) return <Redirect href="/" />;

  const now = new Date();
  const saved = savedTotal(goal);
  const parsedTarget = parseAmountInput(target);
  const parsedDate = parseDateInput(dateText);
  const reminderDay = Number(reminderDayText);
  const reminderDayValid = Number.isInteger(reminderDay) && reminderDay >= 1 && reminderDay <= 28;
  const previewValid = Boolean(
    parsedTarget !== null &&
      parsedTarget >= saved &&
      parsedDate &&
      parsedDate > now &&
      reminderDayValid
  );

  let previewGoal: Goal | null = null;
  if (previewValid && parsedDate) {
    const reminderCycles =
      reminderDay === goal.reminderDay
        ? goal.reminderCycles
        : cyclesAfterReminderDayChange(goal, reminderDay, now);
    previewGoal = {
      ...goal,
      targetAmount: parsedTarget!,
      targetDate: parsedDate.toISOString(),
      reminderDay,
      rhythm,
      reminderCycles,
      ...(reminderCycles?.length
        ? { nextReminderAt: nextReminderFromCycles(reminderCycles).toISOString() }
        : {}),
    };
  }

  const currentSuggested = suggestedAmount(goal, now);
  const currentPeak = peakScheduledAmount(goal, now);
  const nextSuggested = previewGoal ? suggestedAmount(previewGoal, now) : null;
  const nextPeak = previewGoal ? peakScheduledAmount(previewGoal, now) : null;
  const hasChanges =
    target.trim() !== String(goal.targetAmount) ||
    dateText !== formatDate(goal.targetDate) ||
    reminderDayText !== String(goal.reminderDay) ||
    rhythm !== (goal.rhythm ?? 'stable');
  const comparisons = [
    {
      label: 'Montant cible',
      before: formatEuro(goal.targetAmount),
      after: parsedTarget === null ? 'À compléter' : formatEuro(parsedTarget),
    },
    {
      label: 'Date cible',
      before: formatDate(goal.targetDate),
      after: parsedDate ? formatDate(parsedDate) : 'À compléter',
    },
    {
      label: 'Jour de rappel',
      before: `Le ${goal.reminderDay}`,
      after: reminderDayValid ? `Le ${reminderDay}` : 'À compléter',
    },
    {
      label: 'Versement conseillé',
      before: formatEuro(currentSuggested),
      after: nextSuggested === null ? 'À calculer' : formatEuro(nextSuggested),
    },
    {
      label: 'Mois le plus élevé',
      before: formatEuro(currentPeak),
      after: nextPeak === null ? 'À calculer' : formatEuro(nextPeak),
    },
  ];

  const validate = (): string | null => {
    if (parsedTarget === null || parsedTarget <= 0) return 'Indique un montant cible valide.';
    if (parsedTarget < saved) {
      return `La cible ne peut pas être inférieure aux ${formatEuro(saved)} déjà mis de côté.`;
    }
    if (!parsedDate) return 'Date cible invalide. Format attendu : JJ/MM/AAAA.';
    if (parsedDate <= now) return 'Choisis une date cible à venir.';
    if (!reminderDayValid) return 'Choisis un jour de rappel compris entre 1 et 28.';
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      updateGoal(goal.id, {
        targetAmount: parsedTarget!,
        targetDate: parsedDate!.toISOString(),
        rhythm,
      });
      const updated = useStore.getState().goals.find((candidate) => candidate.id === goal.id);
      if (!updated) return;
      if (reminderDay !== goal.reminderDay) {
        await changeReminderDay(updated, reminderDay);
      } else {
        const scheduled = await scheduleGoalReminders(updated, suggestedAmount(updated));
        updateGoal(goal.id, scheduled);
      }
      router.dismissTo({
        pathname: '/goal/[id]',
        params: { id: goal.id, feedback: 'adjusted', feedbackId: String(Date.now()) },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader showBack currentGoalId={goal.id} title="Ajuster le plan" subtitle={goal.name} />

      <Card>
        <Text style={styles.title}>Les paramètres utiles, en un seul écran</Text>
        <Text style={styles.body}>
          Le nom et le type de projet restent inchangés. Tu ajustes seulement l'objectif et son
          échéancier.
        </Text>
        <View style={styles.savedRow}>
          <Text style={styles.savedLabel}>Déjà mis de côté</Text>
          <Text style={styles.savedValue}>{formatEuro(saved)}</Text>
        </View>

        <Field
          label="Nouveau montant cible"
          value={target}
          onChangeText={(value) => {
            setTarget(value);
            setError(null);
          }}
          keyboardType="decimal-pad"
          suffix="EUR"
          error={error?.startsWith('Indique un montant') || error?.startsWith('La cible') ? error : null}
        />
        <DateField
          label="Nouvelle date cible"
          value={dateText}
          onChangeText={(value) => {
            setDateText(value);
            setError(null);
          }}
          error={error?.startsWith('Date cible') || error?.startsWith('Choisis une date') ? error : null}
        />
        <Field
          label="Jour de rappel (1 à 28)"
          value={reminderDayText}
          onChangeText={(value) => {
            setReminderDayText(value.replace(/\D/g, '').slice(0, 2));
            setError(null);
          }}
          keyboardType="number-pad"
          maxLength={2}
          error={error?.startsWith('Choisis un jour') ? error : null}
        />

        <Text style={styles.fieldLabel}>Rythme des versements</Text>
        <View style={styles.rhythms}>
          {RHYTHMS.map((option) => {
            const selected = rhythm === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setRhythm(option.key)}
                style={[styles.rhythm, selected && styles.rhythmSelected]}>
                <Text style={[styles.rhythmText, selected && styles.rhythmTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Avant → après</Text>
        <Text style={styles.body}>Le conseil se recalcule pendant que tu ajustes le plan.</Text>
        {comparisons.map((item) => (
          <View key={item.label} style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>{item.label}</Text>
            <View style={styles.comparisonValues}>
              <Text style={styles.beforeValue}>{item.before}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.afterValue}>{item.after}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Button
        label="Enregistrer les ajustements"
        onPress={() => void save()}
        loading={saving}
        loadingLabel="Mise à jour…"
        disabled={!hasChanges}
        style={styles.saveButton}
      />
      <ActionLoadingOverlay
        visible={saving}
        title="Mise à jour du plan…"
        detail="Recalcul des montants et reprogrammation des rappels."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 21, fontWeight: '800', color: colors.text, lineHeight: 26, marginBottom: 5 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 14 },
  savedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: radius.field,
    padding: 12,
    marginBottom: 14,
  },
  savedLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  savedValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 7 },
  rhythms: { flexDirection: 'row', gap: 7 },
  rhythm: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: 6,
    backgroundColor: colors.card,
  },
  rhythmSelected: { backgroundColor: colors.cardSoft, borderColor: colors.accent },
  rhythmText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  rhythmTextSelected: { color: colors.accent },
  comparisonRow: {
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  comparisonLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  comparisonValues: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  beforeValue: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  arrow: { fontSize: 15, fontWeight: '800', color: colors.accent },
  afterValue: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text, textAlign: 'right' },
  saveButton: { marginBottom: 8 },
});
