import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionLoadingOverlay } from '@/components/action-loading-overlay';
import { AppHeader } from '@/components/app-header';
import { FeedbackBanner } from '@/components/feedback-banner';
import { PlanSummaryDark } from '@/components/plan-summary';
import { Button, Card, DateField, Field, Screen, StepIndicator } from '@/components/ui';
import { colors, fonts, radius } from '@/constants/theme';
import { createGoal } from '@/lib/actions';
import {
  formatDate,
  parseAmountInput,
  parseDateInput,
} from '@/lib/format';
import {
  diagnostic,
  goalSavingsMode,
  nextReminderAfter,
  peakScheduledAmount,
  plannedAmounts,
  prudentCapacity,
  remainingAmount,
  scheduledMonths,
} from '@/lib/plan';
import { usePendingFeedbackStore } from '@/lib/pending-feedback';
import { useStore } from '@/lib/store';
import { waitForMinimumLoading } from '@/lib/timing';
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  GoalCategory,
  SavingsMode,
  SavingsRhythm,
} from '@/lib/types';
import { useMoney } from '@/lib/use-money';

const CATEGORIES: GoalCategory[] = ['emergency', 'car', 'moving', 'travel', 'housing', 'other'];
type StartMode = 'now' | 'later';
type DurationKey = '3m' | '6m' | '1y' | '2y' | 'custom';
const DURATIONS: { key: DurationKey; label: string; months?: number }[] = [
  { key: '3m', label: 'En 3 mois', months: 3 },
  { key: '6m', label: 'En 6 mois', months: 6 },
  { key: '1y', label: 'En 1 an', months: 12 },
  { key: '2y', label: 'En 2 ans', months: 24 },
  { key: 'custom', label: 'Date précise' },
];
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);
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
  const { currency, currencyCode, money, amountInput } = useMoney();
  const router = useRouter();
  const budget = useStore((s) => s.budget);
  const goals = useStore((s) => s.goals);
  const userName = useStore((s) => s.userName);
  const setUserName = useStore((s) => s.setUserName);
  // Signal transitoire (cf. pending-feedback.ts) : ce champ est le point
  // d'entrée « nouveau projet » de l'app depuis le retrait de l'écran de
  // choix du mode, il porte donc la bannière de suppression à sa place.
  const feedbackMessage = usePendingFeedbackStore((s) => s.message);
  const clearFeedback = useCallback(() => usePendingFeedbackStore.getState().take(), []);

  const insets = useSafeAreaInsets();
  const [savingsMode, setSavingsMode] = useState<SavingsMode>('guided');
  const [category, setCategory] = useState<GoalCategory>('emergency');
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameIsSuggested, setNameIsSuggested] = useState(false);
  const [target, setTarget] = useState('');
  const [available, setAvailable] = useState('');
  const [durationKey, setDurationKey] = useState<DurationKey>('6m');
  const [dateText, setDateText] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [rhythmAdvancedOpen, setRhythmAdvancedOpen] = useState(false);
  const [startMode, setStartMode] = useState<StartMode>('now');
  const [startDateText, setStartDateText] = useState('');
  const [reminderDayText, setReminderDayText] = useState(
    String(Math.min(28, new Date().getDate()))
  );
  const [rhythm, setRhythm] = useState<SavingsRhythm>('stable');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const parsedTarget = parseAmountInput(target, currencyCode);
  const parsedAvailable = parseAmountInput(available, currencyCode) ?? 0;
  const parsedStartDate = parseDateInput(startDateText);
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
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deferredStartValid =
    startMode === 'now' || Boolean(parsedStartDate && parsedStartDate > today);
  const scheduleReference =
    startMode === 'later' && parsedStartDate ? parsedStartDate : now;
  // La date cible dérive de la durée choisie (par rapport au démarrage) sauf
  // en mode « Date précise », où elle reste saisie librement.
  const selectedDuration = DURATIONS.find((d) => d.key === durationKey);
  const parsedDate =
    durationKey === 'custom'
      ? parseDateInput(dateText)
      : selectedDuration?.months
        ? addMonths(scheduleReference, selectedDuration.months)
        : null;
  const firstReminder = nextReminderAfter(scheduleReference, reminderDay);
  const previewValid =
    parsedTarget !== null &&
    parsedTarget > 0 &&
    parsedDate !== null &&
    parsedDate > now &&
    deferredStartValid &&
    (startMode === 'now' || (parsedDate > scheduleReference && firstReminder <= parsedDate));
  const planMonths = previewValid ? scheduledMonths(firstReminder, parsedDate!) : 0;
  let preview: {
    average: number;
    first: number;
    last: number;
    peak: number;
    months: number;
  } | null = null;
  if (previewValid && savingsMode === 'guided') {
    const months = planMonths;
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
  const activeExistingGoals = goals.filter(
    (goal) => remainingAmount(goal) > 0 && goalSavingsMode(goal) === 'guided'
  );
  const existingEffort = activeExistingGoals
    .reduce((sum, goal) => sum + peakScheduledAmount(goal), 0);
  const globalPeak = preview ? existingEffort + preview.peak : existingEffort;
  const previewDiagnostic = preview ? diagnostic(globalPeak, budget) : null;
  const remainingAfterExistingGoals = budget
    ? Math.round(
        (budget.income - budget.fixedCharges - budget.variableExpenses - existingEffort) * 100
      ) / 100
    : 0;
  const availablePrudentCapacity = budget
    ? Math.max(0, Math.round((prudentCapacity(budget) - existingEffort) * 100) / 100)
    : 0;

  const validate = (): string | null => {
    if (!name.trim()) return 'Donne un nom à ton projet.';
    if (parsedTarget === null || parsedTarget <= 0) return 'Indique un montant cible valide.';
    if (parsedAvailable > parsedTarget) return 'Le déjà disponible dépasse le montant cible.';
    if (!parsedDate) return 'Date cible invalide. Format attendu : JJ/MM/AAAA.';
    if (parsedDate <= now) return 'Choisis une date cible à venir.';
    if (startMode === 'later') {
      if (!parsedStartDate) return 'Date de démarrage invalide. Format attendu : JJ/MM/AAAA.';
      if (parsedStartDate <= today) return 'Choisis une date de démarrage après aujourd’hui.';
      if (parsedDate <= parsedStartDate) {
        return 'La date cible doit être postérieure au démarrage du projet.';
      }
      if (firstReminder > parsedDate) {
        return `La date cible doit permettre le premier rappel prévu le ${formatDate(firstReminder)}.`;
      }
    }
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const loadingStartedAt = Date.now();
    setSaving(true);
    try {
      const goal = await createGoal({
        name: name.trim(),
        category,
        targetAmount: parsedTarget!,
        alreadyAvailable: parsedAvailable,
        targetDate: parsedDate!,
        reminderDay,
        rhythm,
        savingsMode,
        startDate: startMode === 'later' ? parsedStartDate! : undefined,
      });
      await waitForMinimumLoading(loadingStartedAt);
      router.replace({
        pathname: '/goal/[id]',
        params: { id: goal.id, feedback: 'created', feedbackId: String(Date.now()) },
      });
    } finally {
      await waitForMinimumLoading(loadingStartedAt);
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
    setStep(2);
  };

  return (
    <Screen>
      <AppHeader
        showBack
        title={savingsMode === 'free' ? 'Créer mon projet' : 'Créer mon plan'}
        subtitle={`Étape ${step} sur 2`}
      />
      <StepIndicator
        current={step}
        labels={savingsMode === 'free' ? ['Projet', 'Rappel'] : ['Projet', 'Rythme']}
      />
      {feedbackMessage ? (
        <FeedbackBanner
          key={feedbackMessage.key}
          message={feedbackMessage}
          onFinished={clearFeedback}
        />
      ) : null}

      {step === 1 ? (
        <Card>
          <Text style={styles.title}>
            Quel projet veux-tu préparer ?
          </Text>
          <Text style={styles.body}>Choisis une suggestion ou donne-lui ton propre nom.</Text>

          <Text style={styles.fieldLabel}>Nom du projet</Text>
          <View style={styles.nameRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Type de projet : ${CATEGORY_LABELS[category]}. Modifier`}
              onPress={() => setCategoryPickerOpen(true)}
              style={styles.nameRowCategory}>
              <View style={[styles.chipDot, { backgroundColor: colors.category[category] }]} />
              <Text style={styles.nameRowChevron}>⌄</Text>
            </Pressable>
            <View style={styles.nameRowDivider} />
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setNameIsSuggested(false);
                setError(null);
              }}
              placeholder={
                category === 'other' ? 'Choisis un nom pour ton projet' : CATEGORY_LABELS[category]
              }
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.accent}
              style={styles.nameRowInput}
            />
          </View>

          <Field
            label="Montant cible"
            value={target}
            onChangeText={(t) => {
              setTarget(amountInput(t));
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="3 500"
            suffix={currency.symbol}
          />
          <Field
            label="Déjà disponible"
            value={available}
            onChangeText={(t) => {
              setAvailable(amountInput(t));
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            suffix={currency.symbol}
          />
          <Text style={styles.fieldLabel}>Horizon de temps</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.durationChoices}>
            {DURATIONS.map((d) => {
              const selected = d.key === durationKey;
              return (
                <Pressable
                  key={d.key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    setDurationKey(d.key);
                    setError(null);
                  }}
                  style={[styles.durationChip, selected && styles.durationChipSelected]}>
                  <Text
                    style={[
                      styles.durationChipLabel,
                      selected && styles.durationChipLabelSelected,
                    ]}>
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {durationKey === 'custom' ? (
            <DateField
              label="Date cible"
              value={dateText}
              onChangeText={(t) => {
                setDateText(t);
                setError(null);
              }}
            />
          ) : parsedDate ? (
            <Text style={styles.durationHint}>Objectif visé pour le {formatDate(parsedDate)}.</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: advancedOpen }}
            onPress={() => setAdvancedOpen((v) => !v)}
            style={styles.advancedToggle}>
            <Text style={styles.advancedToggleLabel}>Options avancées</Text>
            <Text style={styles.advancedToggleChevron}>{advancedOpen ? '︿' : '⌄'}</Text>
          </Pressable>
          {advancedOpen ? (
            <View style={styles.advancedSection}>
              <Text style={styles.fieldLabel}>Quand veux-tu commencer ?</Text>
              <View style={styles.startChoices}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: startMode === 'now' }}
                  onPress={() => {
                    setStartMode('now');
                    setError(null);
                  }}
                  style={[styles.startChoice, startMode === 'now' && styles.startChoiceSelected]}>
                  <Text style={styles.startChoiceTitle}>Dès maintenant</Text>
                  <Text style={styles.startChoiceBody}>Le plan commence ce mois-ci.</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: startMode === 'later' }}
                  onPress={() => {
                    setStartMode('later');
                    setError(null);
                  }}
                  style={[styles.startChoice, startMode === 'later' && styles.startChoiceSelected]}>
                  <Text style={styles.startChoiceTitle}>Plus tard</Text>
                  <Text style={styles.startChoiceBody}>Choisis une date future.</Text>
                </Pressable>
              </View>
              {startMode === 'later' ? (
                <>
                  <DateField
                    label="Date de démarrage"
                    value={startDateText}
                    onChangeText={(value) => {
                      setStartDateText(value);
                      setError(null);
                    }}
                  />
                  <Text style={styles.startHint}>
                    Aucun rappel ne partira avant cette date.
                  </Text>
                </>
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={savingsMode === 'free' ? 'Continuer vers le rappel' : 'Continuer vers le rythme'}
            onPress={continueToRhythm}
            style={styles.primaryAction}
          />
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.title}>
              Choisis ton jour de rappel
            </Text>
            <Text style={styles.body}>
              {savingsMode === 'free'
                ? "MMG garde ton rituel mensuel, sans t'imposer de montant."
                : 'Le total ne change pas, seulement la façon d’avancer.'}
            </Text>
            <Text style={styles.fieldLabel}>Jour du rappel dans le mois</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayPicker}>
              {DAYS.map((day) => {
                const selected = day === reminderDay;
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      setReminderDayText(String(day));
                      setError(null);
                    }}
                    style={[styles.dayChip, selected && styles.dayChipSelected]}>
                    <Text style={[styles.dayChipLabel, selected && styles.dayChipLabelSelected]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.dayHint}>
              Rappel le <Text style={styles.dayHintAccent}>{reminderDay}</Text> de chaque mois
            </Text>

            <View style={styles.freeModeToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.freeModeToggleTitle}>Épargne libre</Text>
                <Text style={styles.freeModeToggleBody}>
                  Pas de montant mensuel imposé · Épargne à ton rythme
                </Text>
              </View>
              <Switch
                accessibilityLabel="Activer l'épargne libre"
                value={savingsMode === 'free'}
                onValueChange={(value) => {
                  setSavingsMode(value ? 'free' : 'guided');
                  setError(null);
                }}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.card}
              />
            </View>

            {savingsMode === 'free' ? (
              <View style={styles.freeModeCard}>
                <Text style={styles.freeModeTitle}>Épargne libre</Text>
                <Text style={styles.freeModeBody}>
                  Aucun budget ni montant mensuel ne sera imposé. Ton objectif avance avec les
                  sommes que tu choisis de mettre de côté.
                </Text>
              </View>
            ) : budget ? (
              <View style={styles.budgetSummary}>
                <View style={styles.budgetSummaryHeader}>
                  <Text style={styles.budgetSummaryTitle}>Ton budget mensuel</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ajuster le budget"
                    hitSlop={8}
                    onPress={() =>
                      router.push({
                        pathname: '/onboarding/budget',
                        params: { returnToGoal: '1' },
                      })
                    }>
                    <Text style={styles.budgetAdjust}>Ajuster</Text>
                  </Pressable>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Revenus</Text>
                  <Text style={styles.budgetValue}>{money(budget.income)}</Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Charges fixes</Text>
                  <Text style={styles.budgetValue}>− {money(budget.fixedCharges)}</Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Dépenses</Text>
                  <Text style={styles.budgetValue}>− {money(budget.variableExpenses)}</Text>
                </View>
                {activeExistingGoals.length ? (
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>
                      Projets en cours ({activeExistingGoals.length})
                    </Text>
                    <Text style={styles.budgetValue}>− {money(existingEffort)}</Text>
                  </View>
                ) : null}
                <View style={[styles.budgetRow, styles.budgetResult]}>
                  <Text style={styles.budgetResultLabel}>Reste réellement disponible</Text>
                  <Text
                    style={[
                      styles.budgetResultValue,
                      remainingAfterExistingGoals < 0 && styles.budgetResultWarning,
                    ]}>
                    {money(remainingAfterExistingGoals)}
                  </Text>
                </View>
                <Text style={styles.capacityChipMain}>
                  Capacité prudente encore disponible : {money(availablePrudentCapacity)} / mois
                </Text>
                {preview ? (
                  <Text style={styles.capacityChipDetail}>
                    Effort total avec tes autres projets : {money(globalPeak)} au mois le plus élevé
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.capacityHint}>
                Estime d'abord ta capacité depuis le menu Budget pour obtenir un diagnostic.
              </Text>
            )}

            {savingsMode === 'guided' ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: rhythmAdvancedOpen }}
              onPress={() => setRhythmAdvancedOpen((v) => !v)}
              style={styles.advancedToggle}>
              <Text style={styles.advancedToggleLabel}>Options avancées · rythme</Text>
              <Text style={styles.advancedToggleChevron}>{rhythmAdvancedOpen ? '︿' : '⌄'}</Text>
            </Pressable>
            {rhythmAdvancedOpen ? (
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
                          {money(preview.average)} moy. · pic {money(optionPeak)}
                        </Text>
                      ) : null}
                      <Text style={[styles.rhythmBody, selected && styles.rhythmBodySelected]}>
                        {option.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.freeReminderNote}>
            <Text style={styles.freeReminderTitle}>Montant libre à chaque rappel</Text>
            <Text style={styles.freeReminderBody}>
              Le jour venu, tu indiqueras simplement ce que tu as réellement mis de côté.
            </Text>
          </View>
        )}
          </Card>

          {previewValid ? (
            <>
              <PlanSummaryDark
                description={CATEGORY_DESCRIPTIONS[category]}
                monthly={
                  savingsMode === 'free'
                    ? 'Montant libre'
                    : rhythm === 'stable' && preview
                    ? `${money(preview.average)} / mois`
                    : preview
                      ? `${money(preview.first)} → ${money(preview.last)}`
                      : 'À calculer'
                }
                targetDate={formatDate(parsedDate!)}
                months={`${planMonths} mois`}
                remaining={money(previewRemaining)}
                diagnostic={savingsMode === 'free' ? null : previewDiagnostic}
                reminderDay={reminderDay}
                startDate={
                  startMode === 'later' && parsedStartDate
                    ? formatDate(parsedStartDate)
                    : 'Dès maintenant'
                }
                rhythm={
                  savingsMode === 'free'
                    ? 'Épargne libre'
                    : RHYTHMS.find((option) => option.key === rhythm)!.title
                }
              />
              {previewDiagnostic === 'Confortable' && budget ? (
                <View style={styles.compatCard}>
                  <Text style={styles.compatTitle}>Plan compatible avec ton budget</Text>
                  <Text style={styles.compatBody}>
                    Avec tes autres projets, le mois le plus haut reste à {money(globalPeak)},
                    pour une capacité prudente globale de {money(prudentCapacity(budget))}.
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

          <View style={styles.nameFieldWrap}>
            <View style={styles.nameFieldLabelRow}>
              <Text style={styles.fieldLabel}>Comment doit-on t'appeler ?</Text>
              <Text style={styles.nameFieldOptional}>Optionnel</Text>
            </View>
            <Field
              value={userName ?? ''}
              onChangeText={(t) => setUserName(t)}
              placeholder="Ex : Marie"
              style={styles.nameFieldInput}
            />
            {userName?.trim() ? (
              <Text style={styles.nameHint}>
                On t'appellera <Text style={styles.nameHintAccent}>{userName.trim()}</Text> dans
                l'application.
              </Text>
            ) : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.finalActions}>
            <Button
              label={savingsMode === 'free' ? 'Créer le projet' : 'Créer le plan'}
              onPress={save}
              loading={saving}
              loadingLabel="Création…"
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep(1)}
              style={styles.backLink}>
              <Text style={styles.backLinkLabel}>← Retour</Text>
            </Pressable>
          </View>
        </>
      )}
      <ActionLoadingOverlay
        visible={saving}
        title={savingsMode === 'free' ? 'Création de ton projet…' : 'Création de ton plan…'}
        detail={
          savingsMode === 'free'
            ? 'Préparation de ton objectif et programmation du premier rappel.'
            : 'Calcul de l’échéancier et programmation du premier rappel.'
        }
      />
      <Modal
        visible={categoryPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryPickerOpen(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setCategoryPickerOpen(false)}>
          <Pressable
            accessibilityViewIsModal
            style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}
            onPress={() => {}}>
            <View style={styles.pickerGrabber} />
            <Text style={styles.pickerTitle}>Type de projet</Text>
            <View style={styles.pickerList}>
              {CATEGORIES.map((c) => {
                const selected = c === category;
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => {
                      selectCategory(c);
                      setCategoryPickerOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.pickerRow,
                      selected && styles.pickerRowSelected,
                      pressed && styles.pickerRowPressed,
                    ]}>
                    <View style={[styles.chipDot, { backgroundColor: colors.category[c] }]} />
                    <Text style={styles.pickerRowLabel}>{CATEGORY_LABELS[c]}</Text>
                    <View style={[styles.pickerRadio, selected && styles.pickerRadioSelected]}>
                      {selected ? <View style={styles.pickerRadioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: colors.text,
    lineHeight: 32,
    marginBottom: 5,
  },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 21, marginBottom: 15 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  startChoices: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  startChoice: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    padding: 12,
    backgroundColor: colors.card,
  },
  startChoiceSelected: { borderColor: colors.accent, backgroundColor: colors.cardSoft },
  startChoiceTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  startChoiceBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  startHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: -5, marginBottom: 12 },
  durationChoices: { flexDirection: 'row', gap: 8, marginBottom: 6, paddingRight: 4 },
  durationChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  durationChipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  durationChipLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  durationChipLabelSelected: { color: colors.textOnDark },
  durationHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 4,
  },
  advancedToggleLabel: { fontSize: 14, fontWeight: '800', color: colors.accent },
  advancedToggleChevron: { fontSize: 16, color: colors.accent, fontWeight: '700' },
  advancedSection: { marginBottom: 4 },
  nameFieldWrap: { marginTop: 4 },
  nameFieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameFieldOptional: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: colors.cardSoft,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameFieldInput: { fontFamily: fonts.serifItalic, fontSize: 17 },
  nameHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: -2 },
  nameHintAccent: { fontFamily: fonts.serifItalic, color: colors.accent },
  dayPicker: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingRight: 4 },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayChipLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  dayChipLabelSelected: { color: colors.textOnDark },
  dayHint: { color: colors.textSecondary, fontSize: 14, marginBottom: 14 },
  dayHintAccent: { color: colors.accent, fontWeight: '800' },
  freeModeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    padding: 13,
    marginBottom: 12,
  },
  freeModeToggleTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  freeModeToggleBody: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    paddingLeft: 12,
    marginBottom: 10,
  },
  nameRowCategory: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 13 },
  nameRowChevron: { fontSize: 14, color: colors.textSecondary },
  nameRowDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginLeft: 11 },
  nameRowInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pickerGrabber: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  pickerTitle: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.text, marginBottom: 12 },
  pickerList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    overflow: 'hidden',
    marginBottom: 8,
  },
  pickerRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerRowSelected: { backgroundColor: colors.cardSoft },
  pickerRowPressed: { opacity: 0.72 },
  pickerRowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  pickerRadio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRadioSelected: { borderColor: colors.accent },
  pickerRadioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent },
  budgetSummary: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    padding: 13,
    overflow: 'hidden',
  },
  freeModeCard: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    padding: 14,
    marginTop: 4,
  },
  freeModeTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  freeModeBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 },
  budgetSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetSummaryTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  budgetAdjust: { fontSize: 13, fontWeight: '800', color: colors.accent },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  budgetLabel: { fontSize: 13, color: colors.textSecondary },
  budgetValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  budgetResult: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardSoftBorder,
    marginTop: 5,
    paddingTop: 7,
  },
  budgetResultLabel: { fontSize: 13, fontWeight: '800', color: colors.text },
  budgetResultValue: { fontSize: 13, fontWeight: '800', color: colors.text },
  budgetResultWarning: { color: colors.accent },
  capacityChipMain: { fontSize: 14, fontWeight: '800', color: colors.accent, marginTop: 7 },
  capacityChipDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  capacityHint: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  rhythmChoices: { gap: 10, marginTop: 4 },
  rhythmCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 13,
  },
  rhythmCardSelected: { backgroundColor: colors.cardSoft, borderColor: colors.accent },
  rhythmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rhythmTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  rhythmAmount: { fontSize: 14, fontWeight: '800', color: colors.accent, marginTop: 6 },
  rhythmSelected: { fontSize: 13, fontWeight: '800', color: colors.accent },
  rhythmTextSelected: { color: colors.text },
  rhythmBody: { fontSize: 14, color: colors.textSecondary, marginTop: 5, lineHeight: 20 },
  rhythmBodySelected: { color: colors.textSecondary },
  freeReminderNote: {
    backgroundColor: colors.cardSoft,
    borderRadius: radius.field,
    padding: 14,
    marginTop: 4,
  },
  freeReminderTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  freeReminderBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 },
  compatCard: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 12,
  },
  compatTitle: { fontSize: 17, fontWeight: '800', color: colors.accent, marginBottom: 5 },
  compatBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  error: { color: colors.accent, fontSize: 15, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 },
  primaryAction: { marginTop: 16 },
  finalActions: { gap: 4, marginBottom: 8, alignItems: 'stretch' },
  backLink: { alignSelf: 'center', paddingVertical: 10 },
  backLinkLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
});
