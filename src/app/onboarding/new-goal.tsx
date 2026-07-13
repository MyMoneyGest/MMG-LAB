import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PlanSummaryDark } from '@/components/plan-summary';
import { Button, Card, DateField, Field, Screen, StepIndicator } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { changeReminderDay, createGoal } from '@/lib/actions';
import {
  formatDate,
  formatEuro,
  parseAmountInput,
  parseDateInput,
} from '@/lib/format';
import {
  diagnostic,
  nextReminderAfter,
  peakScheduledAmount,
  plannedAmounts,
  prudentCapacity,
  remainingAmount,
  scheduledMonths,
  suggestedAmount,
} from '@/lib/plan';
import { scheduleGoalReminders } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  GoalCategory,
  SavingsRhythm,
} from '@/lib/types';

const CATEGORIES: GoalCategory[] = ['emergency', 'car', 'moving', 'travel', 'other'];
const RHYTHMS: {
  key: SavingsRhythm;
  title: string;
  description: string;
}[] = [
  { key: 'stable', title: 'Stable', description: 'Le même effort chaque mois, facile à suivre.' },
  { key: 'progressive', title: 'Progressif', description: 'Tu commences plus doucement, puis tu augmentes.' },
  { key: 'regressive', title: 'Régressif', description: 'Tu commences plus fort, puis tu allèges l’effort.' },
];

export default function NewGoalScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const budget = useStore((s) => s.budget);
  const goals = useStore((s) => s.goals);
  const updateGoal = useStore((s) => s.updateGoal);
  const editing = editId ? goals.find((g) => g.id === editId) : undefined;

  const [category, setCategory] = useState<GoalCategory>(editing?.category ?? 'emergency');
  const [name, setName] = useState(editing?.name ?? '');
  const [nameIsSuggested, setNameIsSuggested] = useState(false);
  const [target, setTarget] = useState(editing ? String(editing.targetAmount) : '');
  const [available, setAvailable] = useState(editing ? String(editing.alreadyAvailable) : '');
  const [dateText, setDateText] = useState(editing ? formatDate(editing.targetDate) : '');
  const [reminderDayText, setReminderDayText] = useState(
    String(editing?.reminderDay ?? Math.min(28, new Date().getDate()))
  );
  const [rhythm, setRhythm] = useState<SavingsRhythm>(editing?.rhythm ?? 'stable');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<2 | 3>(2);

  const parsedTarget = parseAmountInput(target);
  const parsedAvailable = parseAmountInput(available) ?? 0;
  const parsedDate = parseDateInput(dateText);
  const reminderDay = Math.min(28, Math.max(1, Number(reminderDayText) || 1));

  const selectCategory = (nextCategory: GoalCategory) => {
    setCategory(nextCategory);
    if (nextCategory === 'other') {
      setName('');
      setNameIsSuggested(false);
    } else if (!name.trim() || nameIsSuggested) {
      setName(CATEGORY_LABELS[nextCategory]);
      setNameIsSuggested(true);
    }
    setError(null);
  };

  // Aperçu du plan dès que les champs clés sont remplis.
  const now = new Date();
  const previewValid =
    parsedTarget !== null && parsedTarget > 0 && parsedDate !== null && parsedDate > now;
  let preview: {
    average: number;
    first: number;
    last: number;
    peak: number;
    months: number;
  } | null = null;
  if (previewValid) {
    const firstReminder = nextReminderAfter(now, reminderDay);
    const months = scheduledMonths(firstReminder, parsedDate!);
    const remaining = Math.max(0, parsedTarget! - parsedAvailable);
    const amounts = plannedAmounts(remaining, months, rhythm);
    preview = {
      average: Math.round((remaining / months) * 100) / 100,
      first: amounts[0],
      last: amounts[amounts.length - 1],
      peak: Math.max(...amounts),
      months,
    };
  }
  const previewRemaining = previewValid ? Math.max(0, parsedTarget! - parsedAvailable) : 0;
  const existingEffort = goals
    .filter((goal) => goal.id !== editing?.id && remainingAmount(goal) > 0)
    .reduce((sum, goal) => sum + peakScheduledAmount(goal), 0);
  const globalPeak = preview ? existingEffort + preview.peak : existingEffort;
  const previewDiagnostic = preview ? diagnostic(globalPeak, budget) : null;

  const validate = (): string | null => {
    if (!name.trim()) return 'Donne un nom à ton projet.';
    if (parsedTarget === null || parsedTarget <= 0) return 'Indique un montant cible valide.';
    if (parsedAvailable > parsedTarget) return 'Le déjà disponible dépasse le montant cible.';
    if (!parsedDate) return 'Date cible invalide. Format attendu : JJ/MM/AAAA.';
    if (parsedDate <= now) return 'Choisis une date cible à venir.';
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
      if (editing) {
        const patch = {
          name: name.trim(),
          category,
          targetAmount: parsedTarget!,
          alreadyAvailable: parsedAvailable,
          targetDate: parsedDate!.toISOString(),
          reminderDay: editing.reminderDay,
          rhythm,
        };
        updateGoal(editing.id, patch);
        const updated = useStore.getState().goals.find((g) => g.id === editing.id)!;
        if (reminderDay !== editing.reminderDay) {
          await changeReminderDay(updated, reminderDay);
        } else {
          const scheduled = await scheduleGoalReminders(updated, suggestedAmount(updated));
          updateGoal(editing.id, scheduled);
        }
        router.back();
      } else {
        const goal = await createGoal({
          name: name.trim(),
          category,
          targetAmount: parsedTarget!,
          alreadyAvailable: parsedAvailable,
          targetDate: parsedDate!,
          reminderDay,
          rhythm,
        });
        router.replace({ pathname: '/goal/[id]', params: { id: goal.id } });
      }
    } finally {
      setSaving(false);
    }
  };

  const continueToRhythm = () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep(3);
  };

  return (
    <Screen>
      <AppHeader
        showBack
        currentGoalId={editing?.id}
        title={editing ? 'Ajuster le plan' : 'Créer mon plan'}
        subtitle={`Étape ${step} sur 3`}
      />
      <StepIndicator current={step} />

      {step === 2 ? (
        <Card>
          <Text style={styles.title}>Quel projet veux-tu préparer ?</Text>
          <Text style={styles.body}>Choisis une suggestion ou donne-lui ton propre nom.</Text>

          <View style={styles.chips}>
            {CATEGORIES.map((c) => {
              const selected = c === category;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => selectCategory(c)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <View style={[styles.chipDot, { backgroundColor: colors.category[c] }]} />
                  <Text style={styles.chipLabel}>{CATEGORY_LABELS[c]}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="Nom du projet"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setNameIsSuggested(false);
              setError(null);
            }}
            placeholder={CATEGORY_LABELS[category]}
          />
          <Field
            label="Montant cible"
            value={target}
            onChangeText={(t) => {
              setTarget(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="3 500"
            suffix="EUR"
          />
          <Field
            label="Déjà disponible"
            value={available}
            onChangeText={(t) => {
              setAvailable(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            suffix="EUR"
          />
          <DateField
            label="Date cible"
            value={dateText}
            onChangeText={(t) => {
              setDateText(t);
              setError(null);
            }}
          />
          {budget ? (
            <View style={styles.capacityChip}>
              <Text style={styles.capacityChipMain}>
                Capacité prudente globale : {formatEuro(prudentCapacity(budget))} / mois
              </Text>
              {preview ? (
                <Text style={styles.capacityChipDetail}>
                  Effort total avec tes autres projets : {formatEuro(globalPeak)} au mois le plus élevé
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.capacityHint}>
              Estime d'abord ta capacité depuis le menu Budget pour obtenir un diagnostic.
            </Text>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Continuer vers le rythme" onPress={continueToRhythm} style={styles.primaryAction} />
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.title}>Choisis ton rythme</Text>
            <Text style={styles.body}>Le total ne change pas, seulement la façon d'avancer.</Text>
        <Field
          label="Jour du rappel dans le mois (1 à 28)"
          value={reminderDayText}
          onChangeText={(t) => {
            setReminderDayText(t.replace(/[^0-9]/g, ''));
            setError(null);
          }}
          keyboardType="number-pad"
          placeholder="1"
        />

        <View style={styles.rhythmChoices}>
          {RHYTHMS.map((option) => {
            const selected = rhythm === option.key;
            const optionAmounts = preview
              ? plannedAmounts(previewRemaining, preview.months, option.key)
              : [];
            const optionPeak = optionAmounts.length ? Math.max(...optionAmounts) : 0;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setRhythm(option.key);
                  setError(null);
                }}
                style={[styles.rhythmCard, selected && styles.rhythmCardSelected]}>
                <View style={styles.rhythmHeader}>
                  <Text style={[styles.rhythmTitle, selected && styles.rhythmTextSelected]}>
                    {option.title}
                  </Text>
                  {selected ? <Text style={styles.rhythmSelected}>Choisi</Text> : null}
                </View>
                {preview ? (
                  <Text style={[styles.rhythmAmount, selected && styles.rhythmTextSelected]}>
                    {formatEuro(preview.average)} moy. · pic {formatEuro(optionPeak)}
                  </Text>
                ) : null}
                <Text style={[styles.rhythmBody, selected && styles.rhythmBodySelected]}>
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
          </Card>

          {preview ? (
            <>
              <PlanSummaryDark
                description={CATEGORY_DESCRIPTIONS[category]}
                monthly={
                  rhythm === 'stable'
                    ? `${formatEuro(preview.average)} / mois`
                    : `${formatEuro(preview.first)} → ${formatEuro(preview.last)}`
                }
                targetDate={formatDate(parsedDate!)}
                months={`${preview.months} mois`}
                remaining={formatEuro(previewRemaining)}
                diagnostic={previewDiagnostic}
                reminderDay={reminderDay}
                rhythm={RHYTHMS.find((option) => option.key === rhythm)!.title}
              />
              {previewDiagnostic === 'Confortable' && budget ? (
                <View style={styles.compatCard}>
                  <Text style={styles.compatTitle}>Plan compatible avec ton budget</Text>
                  <Text style={styles.compatBody}>
                    Avec tes autres projets, le mois le plus haut reste à {formatEuro(globalPeak)},
                    pour une capacité prudente globale de {formatEuro(prudentCapacity(budget))}.
                  </Text>
                </View>
              ) : null}
              {previewDiagnostic === 'Trop serré' ? (
                <View style={styles.compatCard}>
                  <Text style={styles.compatTitle}>Plan au-dessus de ta capacité</Text>
                  <Text style={styles.compatBody}>
                    L'effort cumulé de tes projets dépasse ton reste disponible. Tu peux quand même
                    créer ce plan, mais MMG te signalera qu'un réajustement est nécessaire.
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.finalActions}>
            <Button label="Revenir au projet" variant="secondary" onPress={() => setStep(2)} style={{ flex: 1 }} />
            <Button
              label={editing ? 'Enregistrer' : 'Créer le plan'}
              onPress={save}
              loading={saving}
              style={{ flex: 1 }}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 25, fontWeight: '800', color: colors.text, lineHeight: 31, marginBottom: 6 },
  body: { fontSize: 16, color: colors.textSecondary, lineHeight: 23, marginBottom: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.cardSoft, borderColor: colors.accent },
  chipDot: { width: 12, height: 12, borderRadius: 6 },
  chipLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  capacityChip: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  capacityChipMain: { fontSize: 16, fontWeight: '800', color: colors.accent },
  capacityChipDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  capacityHint: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  rhythmChoices: { gap: 10, marginTop: 4 },
  rhythmCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
  },
  rhythmCardSelected: { backgroundColor: colors.cardSoft, borderColor: colors.accent },
  rhythmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rhythmTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  rhythmAmount: { fontSize: 15, fontWeight: '800', color: colors.accent, marginTop: 7 },
  rhythmSelected: { fontSize: 13, fontWeight: '800', color: colors.accent },
  rhythmTextSelected: { color: colors.text },
  rhythmBody: { fontSize: 14, color: colors.textSecondary, marginTop: 5, lineHeight: 20 },
  rhythmBodySelected: { color: colors.textSecondary },
  compatCard: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.card,
    padding: 20,
    marginBottom: 16,
  },
  compatTitle: { fontSize: 18, fontWeight: '800', color: colors.accent, marginBottom: 6 },
  compatBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  error: { color: colors.accent, fontSize: 15, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 },
  primaryAction: { marginTop: 16 },
  finalActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
});
