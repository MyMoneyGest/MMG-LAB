import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PlanSummaryDark } from '@/components/plan-summary';
import { Button, Card, Eyebrow, Field, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { createGoal } from '@/lib/actions';
import { formatDate, formatEuro, parseAmountInput, parseDateInput } from '@/lib/format';
import { diagnostic, nextReminderAfter, prudentCapacity, suggestedAmount } from '@/lib/plan';
import { scheduleGoalReminder } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, GoalCategory } from '@/lib/types';

const CATEGORIES: GoalCategory[] = ['emergency', 'car', 'moving', 'travel', 'other'];

export default function NewGoalScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const budget = useStore((s) => s.budget);
  const goals = useStore((s) => s.goals);
  const updateGoal = useStore((s) => s.updateGoal);
  const editing = editId ? goals.find((g) => g.id === editId) : undefined;

  const [category, setCategory] = useState<GoalCategory>(editing?.category ?? 'emergency');
  const [name, setName] = useState(editing?.name ?? '');
  const [target, setTarget] = useState(editing ? String(editing.targetAmount) : '');
  const [available, setAvailable] = useState(editing ? String(editing.alreadyAvailable) : '');
  const [dateText, setDateText] = useState(editing ? formatDate(editing.targetDate) : '');
  const [reminderDayText, setReminderDayText] = useState(
    String(editing?.reminderDay ?? Math.min(28, new Date().getDate()))
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedTarget = parseAmountInput(target);
  const parsedAvailable = parseAmountInput(available) ?? 0;
  const parsedDate = parseDateInput(dateText);
  const reminderDay = Math.min(28, Math.max(1, Number(reminderDayText) || 1));

  // Aperçu du plan dès que les champs clés sont remplis.
  const now = new Date();
  const previewValid =
    parsedTarget !== null && parsedTarget > 0 && parsedDate !== null && parsedDate > now;
  let preview: { monthly: number; months: number } | null = null;
  if (previewValid) {
    const months = Math.max(
      1,
      (parsedDate!.getFullYear() - now.getFullYear()) * 12 + (parsedDate!.getMonth() - now.getMonth())
    );
    const remaining = Math.max(0, parsedTarget! - parsedAvailable);
    preview = { monthly: Math.ceil((remaining / months) * 100) / 100, months };
  }
  const previewRemaining = previewValid ? Math.max(0, parsedTarget! - parsedAvailable) : 0;
  const previewDiagnostic = preview ? diagnostic(preview.monthly, budget) : null;

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
          reminderDay,
          // Le jour de rappel a-t-il bougé ? Alors on repart de la prochaine occurrence.
          ...(reminderDay !== editing.reminderDay
            ? { nextReminderAt: nextReminderAfter(new Date(), reminderDay).toISOString() }
            : {}),
        };
        updateGoal(editing.id, patch);
        const updated = useStore.getState().goals.find((g) => g.id === editing.id)!;
        const notificationId = await scheduleGoalReminder(updated, suggestedAmount(updated));
        updateGoal(editing.id, { notificationId: notificationId ?? undefined });
        router.back();
      } else {
        const goal = await createGoal({
          name: name.trim(),
          category,
          targetAmount: parsedTarget!,
          alreadyAvailable: parsedAvailable,
          targetDate: parsedDate!,
          reminderDay,
        });
        router.replace({ pathname: '/goal/[id]', params: { id: goal.id } });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader showBack currentGoalId={editing?.id} />

      <Card>
        <Eyebrow>Ton projet</Eyebrow>
        <Text style={styles.title}>Qu'est-ce que tu veux préparer ?</Text>
        <Text style={styles.body}>On commence par la motivation. Le montant vient après.</Text>

        <View style={styles.chips}>
          {CATEGORIES.map((c) => {
            const selected = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
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
            setError(null);
          }}
          placeholder={CATEGORY_LABELS[category]}
        />
      </Card>

      <Card>
        <Text style={styles.title}>De combien as-tu besoin ?</Text>
        <Text style={styles.body}>Pas besoin d'être exact. MMG ajustera le plan plus tard.</Text>

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
        {budget ? (
          <Text style={styles.capacityChip}>
            Capacité prudente : {formatEuro(prudentCapacity(budget))} / mois
          </Text>
        ) : (
          <Text style={styles.capacityHint}>
            Astuce : estime d'abord ta capacité (menu → Ajuster mon budget) pour obtenir un diagnostic.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.title}>Ton rythme</Text>
        <Field
          label="Date cible"
          value={dateText}
          onChangeText={(t) => {
            setDateText(t);
            setError(null);
          }}
          placeholder="JJ/MM/AAAA"
          keyboardType="numbers-and-punctuation"
        />
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

        <View style={styles.rhythmCard}>
          <View style={styles.rhythmHeader}>
            <Text style={styles.rhythmTitle}>Rythme stable</Text>
            {preview ? <Text style={styles.rhythmAmount}>{formatEuro(preview.monthly)} moy.</Text> : null}
          </View>
          <Text style={styles.rhythmBody}>Le même effort chaque mois, facile à suivre.</Text>
        </View>
      </Card>

      {preview ? (
        <>
          <PlanSummaryDark
            description={CATEGORY_DESCRIPTIONS[category]}
            monthly={`${formatEuro(preview.monthly)} / mois`}
            targetDate={formatDate(parsedDate!)}
            months={`${preview.months} mois`}
            remaining={formatEuro(previewRemaining)}
            diagnostic={previewDiagnostic}
            reminderDay={reminderDay}
          />
          {previewDiagnostic === 'Confortable' && budget ? (
            <View style={styles.compatCard}>
              <Text style={styles.compatTitle}>Plan compatible avec ton budget</Text>
              <Text style={styles.compatBody}>
                Le mois le plus haut reste à {formatEuro(preview.monthly)}, pour une capacité prudente de{' '}
                {formatEuro(prudentCapacity(budget))}.
              </Text>
            </View>
          ) : null}
          {previewDiagnostic === 'Trop serré' ? (
            <View style={styles.compatCard}>
              <Text style={styles.compatTitle}>Plan au-dessus de ta capacité</Text>
              <Text style={styles.compatBody}>
                Tu peux quand même le créer : éloigne la date cible ou réduis le montant pour retrouver un
                rythme confortable.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label={editing ? 'Enregistrer les ajustements' : 'Créer le plan'}
        onPress={save}
        disabled={saving}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 35, marginBottom: 8 },
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
  chipSelected: { backgroundColor: colors.cardSoft, borderColor: '#2E6E7E' },
  chipDot: { width: 12, height: 12, borderRadius: 6 },
  chipLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  capacityChip: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  capacityHint: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  rhythmCard: { backgroundColor: colors.dark, borderRadius: 20, padding: 18, marginTop: 4 },
  rhythmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rhythmTitle: { fontSize: 19, fontWeight: '800', color: colors.textOnDark },
  rhythmAmount: { fontSize: 17, fontWeight: '800', color: colors.textOnDark },
  rhythmBody: { fontSize: 15, color: colors.textOnDarkMuted, marginTop: 6, lineHeight: 21 },
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
});
