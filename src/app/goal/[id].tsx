import { Redirect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ActionLoadingOverlay } from '@/components/action-loading-overlay';
import { AppDialog } from '@/components/app-dialog';
import { AmountModal } from '@/components/amount-modal';
import { AppHeader } from '@/components/app-header';
import { BalanceModal } from '@/components/balance-modal';
import { ConfirmationOverlay } from '@/components/confirmation-overlay';
import { ContributionChoiceModal } from '@/components/contribution-choice-modal';
import { FeedbackBanner } from '@/components/feedback-banner';
import type { FeedbackMessage } from '@/components/feedback-banner';
import { ReportModal } from '@/components/report-modal';
import { RecentContributionModal } from '@/components/recent-contribution-modal';
import { RebalanceModal } from '@/components/rebalance-modal';
import { ReminderDayModal } from '@/components/reminder-day-modal';
import { SavingsLocationModal } from '@/components/savings-location-modal';
import { Button, Card, Eyebrow, ProgressRing, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import {
  applyGlobalRebalance,
  changeMidCycleNudge,
  changeReminderDay,
  clearGlobalRebalanceReview,
  confirmContribution,
  deferGlobalRebalance,
  reconcileGlobalBalance,
} from '@/lib/actions';
import type { ContributionSource } from '@/lib/actions';
import { fitFontSize, formatDate, formatReminderDay } from '@/lib/format';
import { TEST_TOOLS_ENABLED } from '@/lib/test-tools';
import {
  hasNotificationPermission,
  notificationsSupported,
  scheduleTestNudge,
} from '@/lib/notifications';
import {
  hasPendingAction,
  balanceCheckDue,
  buildGlobalRebalanceProposal,
  contributionPlan,
  currentUpcomingCycle,
  estimatedGlobalBalance,
  goalSavingsMode,
  goalStartsInFuture,
  latestBalanceSnapshot,
  progressPct,
  rebalanceReviewDue,
  recentDeposits,
  remainingAmount,
  savedTotal,
  suggestedAmount,
  upcomingSchedule,
} from '@/lib/plan';
import type { ContributionIntent } from '@/lib/plan';
import type { GlobalRebalanceProposal } from '@/lib/plan';
import { useStore } from '@/lib/store';
import {
  MIN_INLINE_LOADING_MS,
  waitForMinimumLoading,
} from '@/lib/timing';
import type { Contribution } from '@/lib/types';
import type { RebalanceReason } from '@/lib/types';
import { useMoney } from '@/lib/use-money';

type Tab = 'today' | 'schedule' | 'history';

const TABS: { key: Tab; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'schedule', label: 'Échéancier' },
  { key: 'history', label: 'Historique' },
];

const handledNotificationActions = new Set<string>();
const handledFeedbackMessages = new Set<string>();

export default function GoalScreen() {
  const { money } = useMoney();
  const {
    id,
    notificationAction,
    notificationIsTest,
    responseKey,
    feedback: routeFeedback,
    feedbackId,
    feedbackName,
  } = useLocalSearchParams<{
    id: string;
    notificationAction?: 'done' | 'edit' | 'postpone';
    notificationIsTest?: string;
    responseKey?: string;
    feedback?: 'created' | 'adjusted' | 'deleted';
    feedbackId?: string;
    feedbackName?: string;
  }>();
  const goal = useStore((s) => s.goals.find((g) => g.id === id));
  const goals = useStore((s) => s.goals);
  const budget = useStore((s) => s.budget);
  const balanceSnapshots = useStore((s) => s.balanceSnapshots ?? []);
  const rebalanceReview = useStore((s) => s.rebalanceReview);
  const setLastViewed = useStore((s) => s.setLastViewed);
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());

  const [tab, setTab] = useState<Tab>('today');
  const [amountModal, setAmountModal] = useState<'deposit' | null>(null);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [balanceInfoOpen, setBalanceInfoOpen] = useState(false);
  const [rebalanceProposal, setRebalanceProposal] =
    useState<GlobalRebalanceProposal | null>(null);
  const [rebalanceReason, setRebalanceReason] =
    useState<RebalanceReason | 'review'>('balance');
  const [reportOpen, setReportOpen] = useState(false);
  const [reminderDayOpen, setReminderDayOpen] = useState(false);
  const [savingsLocationOpen, setSavingsLocationOpen] = useState(false);
  const [modalFromTest, setModalFromTest] = useState(false);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [nudgeSaving, setNudgeSaving] = useState(false);
  const [nudgeTestPending, setNudgeTestPending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [confirmation, setConfirmation] = useState<{
    amount: number;
    nextReminderAt?: string;
    nextAmount?: number;
    done: boolean;
    cycleAnchorAt?: string;
  } | null>(null);
  const [pendingContribution, setPendingContribution] = useState<{
    amount: number;
    source: ContributionSource;
    recent: Contribution[];
    stage: 'recent' | 'choice';
    choiceAnchorAt?: string;
    intent: ContributionIntent;
  } | null>(null);
  const clearFeedback = useCallback(() => setFeedbackMessage(null), []);
  const showFeedback = useCallback((title: string, detail: string) => {
    setFeedbackMessage({ key: String(Date.now()), title, detail });
  }, []);

  useEffect(() => {
    if (hydrated) return;
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  useEffect(() => {
    if (goal) setLastViewed(goal.id);
  }, [goal?.id]);

  useEffect(() => {
    if (!feedbackId || !routeFeedback || handledFeedbackMessages.has(feedbackId)) return;
    handledFeedbackMessages.add(feedbackId);
    setFeedbackMessage(
      routeFeedback === 'created'
        ? {
            key: feedbackId,
            title: 'Ton projet est prêt',
            detail:
              goal && goalStartsInFuture(goal)
                ? `Il démarrera le ${formatDate(goal.startDate!)}. Aucun rappel ne partira avant.`
                : 'Le premier rappel a été programmé.',
          }
        : routeFeedback === 'adjusted'
          ? {
            key: feedbackId,
            title: 'Plan mis à jour',
            detail: 'Les montants et les prochains rappels ont été recalculés.',
          }
          : {
              key: feedbackId,
              title: 'Projet supprimé',
              detail: `« ${feedbackName ?? 'Le projet'} » et son historique ont été supprimés.`,
            }
    );
  }, [feedbackId, feedbackName, goal?.startDate, routeFeedback]);

  useEffect(() => {
    if (!notificationsSupported) return; // web : pas de rappels, pas de bannière
    hasNotificationPermission().then((granted) => setNotifBlocked(!granted));
  }, []);

  const performConfirm = async (
    amount: number,
    source: ContributionSource,
    intent: ContributionIntent = 'surplus'
  ) => {
    if (!goal) return;
    const currentGoal = useStore.getState().goals.find((candidate) => candidate.id === goal.id);
    if (!currentGoal) return;
    setAmountModal(null);
    const loadingStartedAt = Date.now();
    setActionLoading(true);
    try {
      const plan = await confirmContribution(currentGoal, amount, source, intent);
      const updated = useStore.getState().goals.find((g) => g.id === goal.id);
      await waitForMinimumLoading(loadingStartedAt);
      setActionLoading(false);
      setConfirmation({
        amount,
        nextReminderAt: updated?.nextReminderAt,
        nextAmount: updated ? suggestedAmount(updated) : undefined,
        done: updated ? remainingAmount(updated) <= 0 : false,
        cycleAnchorAt: plan.cycleAnchorAt,
      });
    } finally {
      await waitForMinimumLoading(loadingStartedAt);
      setActionLoading(false);
    }
  };

  const confirm = (amount: number, source: ContributionSource) => {
    if (!goal) return;
    const currentGoal = useStore.getState().goals.find((candidate) => candidate.id === goal.id);
    if (!currentGoal) return;
    const recent = recentDeposits(currentGoal);
    const defaultPlan = contributionPlan(currentGoal);
    const current = defaultPlan.forcedDebt ? null : currentUpcomingCycle(currentGoal);
    if (recent.length) {
      setAmountModal(null);
      setPendingContribution({
        amount,
        source,
        recent,
        stage: 'recent',
        choiceAnchorAt: current?.anchorAt,
        intent: 'surplus',
      });
      return;
    }
    if (current) {
      setAmountModal(null);
      setPendingContribution({
        amount,
        source,
        recent: [],
        stage: 'choice',
        choiceAnchorAt: current.anchorAt,
        intent: 'surplus',
      });
      return;
    }
    void performConfirm(amount, source);
  };

  useEffect(() => {
    if (!goal || !notificationAction) return;
    const actionKey = responseKey ?? `${goal.id}:${notificationAction}:${notificationIsTest ?? '0'}`;
    if (handledNotificationActions.has(actionKey)) return;
    handledNotificationActions.add(actionKey);
    setTab('today');

    if (notificationAction === 'edit') {
      setModalFromTest(notificationIsTest === '1');
      setAmountModal('deposit');
    } else if (notificationAction === 'postpone') {
      setModalFromTest(notificationIsTest === '1');
      setReportOpen(true);
    } else {
      if (goalSavingsMode(goal) === 'free') {
        setModalFromTest(notificationIsTest === '1');
        setAmountModal('deposit');
      } else {
        const amount = suggestedAmount(goal);
        confirm(amount, notificationIsTest === '1' ? 'test_notification' : 'one_tap');
      }
    }
  }, [goal?.id, notificationAction, notificationIsTest, responseKey]);

  if (!hydrated) return null;
  if (!goal) return <Redirect href="/" />;

  const freeMode = goalSavingsMode(goal) === 'free';
  const waitingToStart = goalStartsInFuture(goal);
  const saved = savedTotal(goal);
  const remaining = remainingAmount(goal);
  const pct = progressPct(goal);
  const suggested = suggestedAmount(goal);
  const reached = remaining <= 0;
  const pending = hasPendingAction(goal);
  const latestSnapshot = latestBalanceSnapshot(balanceSnapshots);
  const globalBalance = estimatedGlobalBalance(goals, balanceSnapshots);
  const checkBalance = balanceCheckDue(goals, balanceSnapshots);
  const globalPlan = budget ? buildGlobalRebalanceProposal(goals, budget) : null;
  const capacityExceeded = Boolean(
    globalPlan && globalPlan.currentEffort > globalPlan.capacity
  );
  const reviewDue = Boolean(
    rebalanceReviewDue(rebalanceReview) &&
      globalPlan &&
      (globalPlan.goals.length > 0 || !globalPlan.possible)
  );
  const schedule = upcomingSchedule(goal);
  const explainRealBalance = () => setBalanceInfoOpen(true);
  const toggleMidCycleNudge = async (enabled: boolean) => {
    const currentGoal = useStore.getState().goals.find((candidate) => candidate.id === goal.id);
    if (!currentGoal) return;
    setNudgeSaving(true);
    try {
      const result = await changeMidCycleNudge(currentGoal, enabled);
      if (!result.ok) {
        setNotifBlocked(true);
        showFeedback(
          'Notifications désactivées',
          'Autorise les notifications pour MMG avant d’activer ce coup de pouce.'
        );
        return;
      }
      setNotifBlocked(false);
      showFeedback(
        enabled ? 'Coup de pouce activé' : 'Coup de pouce désactivé',
        enabled
          ? 'Un message sobre sera envoyé à mi-chemin entre deux rappels.'
          : 'Seul le rappel mensuel de ce projet reste actif.'
      );
    } finally {
      setNudgeSaving(false);
    }
  };
  // Aperçu du coup de pouce : sans effet (notification passive, aucune action, jamais
  // dans la mesure), pour vérifier son caractère discret en quelques secondes.
  const previewMidCycleNudge = async () => {
    if (nudgeTestPending) return;
    setNudgeTestPending(true);
    try {
      const result = await scheduleTestNudge(goal);
      if (result.ok) {
        showFeedback(
          'Aperçu envoyé',
          'Le coup de pouce arrivera dans 5 secondes, tel qu’il apparaîtra vraiment.'
        );
      } else if (result.reason === 'unsupported') {
        showFeedback(
          'Aperçu indisponible ici',
          'Les notifications ne sont pas disponibles sur le web ni dans Expo Go Android.'
        );
      } else if (result.reason === 'permission') {
        showFeedback(
          'Notifications désactivées',
          'Autorise les notifications pour MMG avant de tester le coup de pouce.'
        );
      } else {
        showFeedback('Aperçu non envoyé', 'Une erreur est survenue. Réessaie dans un instant.');
      }
    } finally {
      setNudgeTestPending(false);
    }
  };
  const midCycleNudgeSetting = !reached ? (
    <View style={styles.nudgeSetting}>
      <View style={styles.nudgeRow}>
        <View style={styles.nudgeCopy}>
          <Text style={styles.nudgeTitle}>Coup de pouce à mi-parcours</Text>
          <Text style={styles.nudgeText}>Un message entre deux rappels, sans action demandée.</Text>
        </View>
        <Switch
          accessibilityLabel="Activer le coup de pouce à mi-parcours"
          accessibilityState={{ checked: Boolean(goal.midCycleNudgeEnabled), disabled: nudgeSaving }}
          value={Boolean(goal.midCycleNudgeEnabled)}
          disabled={nudgeSaving}
          onValueChange={(enabled) => void toggleMidCycleNudge(enabled)}
          trackColor={{ false: colors.border, true: colors.cardSoftBorder }}
          thumbColor={goal.midCycleNudgeEnabled ? colors.accent : colors.card}
          ios_backgroundColor={colors.border}
        />
      </View>
      {TEST_TOOLS_ENABLED && goal.midCycleNudgeEnabled && notificationsSupported ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir un aperçu du coup de pouce"
          disabled={nudgeTestPending}
          hitSlop={8}
          onPress={() => void previewMidCycleNudge()}
          style={({ pressed }) => [styles.nudgePreview, pressed && styles.nudgePreviewPressed]}>
          <Text style={styles.nudgePreviewLabel}>
            {nudgeTestPending ? 'Aperçu en cours…' : 'Voir un aperçu (5 s)'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  ) : null;
  const tabBar = (
    <View style={styles.tabs}>
      {TABS.map((t) => {
        const active = t.key === tab;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => setTab(t.key)}
            style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Screen footer={tabBar}>
      <AppHeader
        currentGoalId={goal.id}
        title={goal.name}
        subtitle={
          waitingToStart
            ? `Prévu le ${formatDate(goal.startDate!)}`
            : freeMode
              ? 'Épargne libre'
              : 'Plan actif'
        }
      />

      {feedbackMessage ? (
        <FeedbackBanner
          key={feedbackMessage.key}
          message={feedbackMessage}
          onFinished={clearFeedback}
        />
      ) : null}

      {notifBlocked ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Rappels impossibles : autorise les notifications pour MMG.
          </Text>
        </View>
      ) : null}

      {reviewDue && globalPlan && rebalanceReview ? (
        <View style={styles.reviewBanner}>
          <Text style={styles.reviewTitle}>Ton échéancier mérite une vérification</Text>
          <Text style={styles.reviewText}>
            Tu avais conservé tes anciens plans après un changement. Revois la proposition pour
            éviter qu'ils reposent trop longtemps sur une situation dépassée.
          </Text>
          <View style={styles.reviewButtons}>
            <Button
              label="Revoir"
              onPress={() => {
                setRebalanceReason('review');
                setRebalanceProposal(globalPlan);
              }}
              style={{ flex: 1 }}
            />
            <Button
              label="Dans 14 jours"
              variant="secondary"
              onPress={() => deferGlobalRebalance(rebalanceReview.reason, 'deferred')}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : capacityExceeded && globalPlan && !rebalanceReview ? (
        <View style={styles.capacityWarning}>
          <Text style={styles.capacityWarningText}>
            Au mois le plus exigeant, tes plans demandent {money(globalPlan.currentEffort)},
            mais ta capacité prudente globale est de {money(globalPlan.capacity)}. Un
            réajustement est recommandé.
          </Text>
        </View>
      ) : null}

      <Card>
        {/* L'anneau affiche le montant mis de côté et le pourcentage en son centre
            (fitFontSize interne gère les gros montants FCFA sans déborder). Les
            infos secondaires (restant, cible) restent en dessous. */}
        <ProgressRing pct={pct} amount={money(saved)} />
        <Text style={styles.savedMeta}>
          {money(remaining)} restants · sur {money(goal.targetAmount)}
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={5}
          accessibilityLabel={
            goal.savingsLocation
              ? `Lieu de l'épargne : ${goal.savingsLocation}. Modifier`
              : "Indiquer où l'épargne de ce projet est conservée"
          }
          onPress={() => setSavingsLocationOpen(true)}
          style={({ pressed }) => [
            styles.savingsLocation,
            pressed && styles.savingsLocationPressed,
          ]}>
          <Text style={styles.savingsLocationLabel}>Où ?</Text>
          <Text numberOfLines={1} style={styles.savingsLocationValue}>
            {goal.savingsLocation ?? 'Ajouter'}
          </Text>
          <Text style={styles.savingsLocationArrow}>›</Text>
        </Pressable>
        <View style={styles.progressFooter}>
          <Text style={styles.targetDate}>Cible {formatDate(goal.targetDate)}</Text>
        </View>
      </Card>

      {tab === 'today' ? (
        <Card>
          <Eyebrow>Ce mois-ci</Eyebrow>
          {reached ? (
            <>
              <Text style={styles.reachedTitle}>Objectif atteint 🎉</Text>
              <Text style={styles.reachedBody}>
                « {goal.name} » est financé. Tu peux créer un nouveau projet depuis le menu.
              </Text>
            </>
          ) : waitingToStart ? (
            <View style={styles.plannedCard}>
              <Text style={styles.plannedTitle}>
                Tout est prêt pour le {formatDate(goal.startDate!)}
              </Text>
              <Text style={styles.plannedBody}>
                Le plan et ses rappels commenceront à cette date. Ton premier rappel régulier
                reste prévu le {formatDate(goal.nextReminderAt)}.
              </Text>
              <Text style={styles.plannedNote}>Aucune action n’est attendue avant le démarrage.</Text>
              {midCycleNudgeSetting}
            </View>
          ) : (
            <>
              <View style={styles.adviceCard}>
                <Text style={styles.adviceLabel}>
                  {freeMode ? 'Ton rythme libre' : 'Montant conseillé'}
                </Text>
                {freeMode ? (
                  <Text style={styles.adviceFreeAmount}>Aucun montant imposé</Text>
                ) : (
                  <Text
                    style={[styles.adviceAmount, { fontSize: fitFontSize(money(suggested), 38) }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.4}>
                    {money(suggested)}
                  </Text>
                )}
                <Text style={styles.adviceReminder}>
                  {pending ? 'Rappel en cours : ' : 'Rappel prévu : '}
                  {formatDate(goal.nextReminderAt)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setReminderDayOpen(true)}
                  style={styles.reminderDayLink}>
                  <Text style={styles.reminderDayLinkText}>
                    Jour de rappel : le {formatReminderDay(goal.reminderDay)} · Modifier
                  </Text>
                </Pressable>
                {midCycleNudgeSetting}
              </View>
              {freeMode ? (
                <View style={{ gap: 12 }}>
                  <Button
                    label="J'ai mis de côté"
                    onPress={() => {
                      setModalFromTest(false);
                      setAmountModal('deposit');
                    }}
                    loading={actionLoading}
                    loadingLabel="Enregistrement…"
                  />
                  <Button
                    label="Reporter"
                    variant="secondary"
                    onPress={() => {
                      setModalFromTest(false);
                      setReportOpen(true);
                    }}
                  />
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <Button
                    label={`Versement fait (${money(suggested)})`}
                    onPress={() => confirm(suggested, 'one_tap')}
                    loading={actionLoading}
                    loadingLabel="Enregistrement…"
                  />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button
                      label="Montant différent"
                      variant="secondary"
                      onPress={() => {
                        setModalFromTest(false);
                        setAmountModal('deposit');
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="Reporter"
                      variant="secondary"
                      onPress={() => {
                        setModalFromTest(false);
                        setReportOpen(true);
                      }}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}
              {checkBalance ? (
                <View style={styles.balanceCheckCard}>
                  <Text style={styles.balanceCheckTitle}>Vérification trimestrielle</Text>
                  <Text style={styles.balanceCheckText}>
                    Confirme ton solde réel pour éviter qu’un mouvement oublié décale tes plans.
                  </Text>
                  <Button
                    label="Confirmer mon solde"
                    variant="secondary"
                    onPress={() => setBalanceOpen(true)}
                  />
                </View>
              ) : null}
              {schedule.length ? (
                <View style={styles.previewSchedule}>
                  <Text style={styles.previewTitle}>Les deux prochaines échéances</Text>
                  {schedule.slice(0, 2).map((row, index) => (
                    <View key={row.date.toISOString()} style={styles.previewRow}>
                      <View>
                        <Text style={styles.previewDate}>{formatDate(row.date)}</Text>
                        <Text style={styles.previewMeta}>{index === 0 ? 'Prochaine' : 'Puis'}</Text>
                      </View>
                      <Text style={styles.previewAmount}>
                        {freeMode ? 'Montant libre' : money(row.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          )}
          <View style={styles.balanceActionRow}>
            <Button
              label="Mettre à jour le solde réel"
              variant="secondary"
              onPress={() => setBalanceOpen(true)}
              style={{ flex: 1 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Expliquer le solde réel"
              hitSlop={6}
              onPress={explainRealBalance}
              style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}>
              <Text style={styles.infoButtonText}>i</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}

      {tab === 'schedule' ? (
        <Card>
          <Eyebrow>Échéancier</Eyebrow>
          {reached ? (
            <Text style={styles.reachedBody}>Aucune échéance à venir : objectif atteint.</Text>
          ) : (
            schedule.map((row, index) => (
              <View key={row.date.toISOString()} style={styles.scheduleRow}>
                <View>
                  <Text style={styles.scheduleDate}>{formatDate(row.date)}</Text>
                  {index === 0 ? <Text style={styles.scheduleNext}>Prochain rappel</Text> : null}
                </View>
                <Text style={styles.scheduleAmount}>
                  {freeMode ? 'Montant libre' : money(row.amount)}
                </Text>
              </View>
            ))
          )}
        </Card>
      ) : null}

      {tab === 'history' ? (
        <Card>
          <Eyebrow>Historique</Eyebrow>
          {goal.contributions.length === 0 ? (
            <Text style={styles.reachedBody}>
              Aucun geste pour l'instant. Le premier versement lancera l'historique.
            </Text>
          ) : (
            [...goal.contributions]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((c) => (
                <View key={c.id} style={styles.scheduleRow}>
                  <View>
                    <Text style={styles.scheduleDate}>
                      {c.type === 'deposit' ? 'Versement' : 'Retrait'}
                    </Text>
                    <Text style={styles.scheduleNext}>{formatDate(c.date)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.scheduleAmount,
                      { color: c.type === 'deposit' ? colors.success : colors.accent },
                    ]}>
                    {c.type === 'deposit' ? '+' : '−'}
                    {money(c.amount)}
                  </Text>
                </View>
              ))
          )}
        </Card>
      ) : null}

      <AmountModal
        visible={amountModal === 'deposit'}
        title={freeMode ? 'Combien as-tu mis de côté ?' : 'Montant différent'}
        subtitle={
          freeMode
            ? 'Chaque montant compte. Ton objectif avance sans mensualité imposée.'
            : "N'importe quel montant compte : le plan s'ajustera."
        }
        confirmLabel="Valider"
        onConfirm={(amount) => {
          const source = modalFromTest ? 'test_notification' : 'custom_amount';
          setModalFromTest(false);
          confirm(amount, source);
        }}
        onClose={() => {
          setModalFromTest(false);
          setAmountModal(null);
        }}
      />
      <AppDialog
        visible={balanceInfoOpen}
        eyebrow="Solde réel"
        title="À quoi sert le solde réel ?"
        message="C’est le total que tu as réellement mis de côté, tous projets confondus. MMG l’utilise pour recaler ta progression. Rien n’est connecté à ta banque : c’est toi qui indiques ce montant."
        onClose={() => setBalanceInfoOpen(false)}
      />
      <BalanceModal
        visible={balanceOpen}
        estimatedBalance={globalBalance}
        lastConfirmedAt={latestSnapshot?.date}
        onClose={() => setBalanceOpen(false)}
        onConfirm={async (amount) => {
          const loadingStartedAt = Date.now();
          const proposal = await reconcileGlobalBalance(amount);
          await waitForMinimumLoading(loadingStartedAt, MIN_INLINE_LOADING_MS);
          setBalanceOpen(false);
          if (proposal && (proposal.goals.length || !proposal.possible)) {
            setRebalanceReason('balance');
            setRebalanceProposal(proposal);
          } else {
            clearGlobalRebalanceReview();
            showFeedback(
              'Solde réel confirmé',
              'La progression et les montants conseillés sont maintenant recalés.'
            );
          }
        }}
      />
      <RebalanceModal
        proposal={rebalanceProposal}
        reason={rebalanceReason}
        onKeep={() => {
          deferGlobalRebalance(
            rebalanceReason === 'review' ? rebalanceReview?.reason ?? 'balance' : rebalanceReason,
            rebalanceReason === 'review' ? 'deferred' : 'kept'
          );
          setRebalanceProposal(null);
        }}
        onApply={async () => {
          if (!rebalanceProposal) return;
          const loadingStartedAt = Date.now();
          await applyGlobalRebalance(rebalanceProposal);
          await waitForMinimumLoading(loadingStartedAt, MIN_INLINE_LOADING_MS);
          setRebalanceProposal(null);
          showFeedback(
            'Échéancier mis à jour',
            'Les prochaines dates ont été adaptées à ta situation.'
          );
        }}
      />
      <ReminderDayModal
        visible={reminderDayOpen}
        currentDay={goal.reminderDay}
        onClose={() => setReminderDayOpen(false)}
        onConfirm={async (day) => {
          const loadingStartedAt = Date.now();
          const currentGoal = useStore
            .getState()
            .goals.find((candidate) => candidate.id === goal.id);
          if (!currentGoal) return;
          await changeReminderDay(currentGoal, day);
          await waitForMinimumLoading(loadingStartedAt, MIN_INLINE_LOADING_MS);
          setReminderDayOpen(false);
          showFeedback('Jour de rappel modifié', `Le rappel mensuel est maintenant prévu le ${day}.`);
        }}
      />
      <SavingsLocationModal
        visible={savingsLocationOpen}
        currentLocation={goal.savingsLocation}
        onClose={() => setSavingsLocationOpen(false)}
        onConfirm={(location) => {
          useStore.getState().updateGoal(goal.id, { savingsLocation: location });
          setSavingsLocationOpen(false);
          showFeedback(
            location ? 'Repère enregistré' : 'Repère retiré',
            location
              ? `Tu retrouveras « ${location} » sur la fiche de ce projet.`
              : "Ce projet n'affiche plus de lieu d'épargne."
          );
        }}
      />
      <ReportModal
        visible={reportOpen}
        goal={goal}
        isTestAction={modalFromTest}
        onClose={() => {
          setModalFromTest(false);
          setReportOpen(false);
        }}
        onDone={() => {
          setModalFromTest(false);
          setReportOpen(false);
          const updated = useStore
            .getState()
            .goals.find((candidate) => candidate.id === goal.id);
          showFeedback(
            'Rappel reporté',
            updated
              ? `Le prochain rappel est prévu le ${formatDate(updated.nextReminderAt)}.`
              : 'La nouvelle date a été programmée.'
          );
        }}
      />
      <ConfirmationOverlay
        visible={confirmation !== null}
        amount={confirmation?.amount ?? 0}
        goalName={goal.name}
        nextReminderAt={confirmation?.nextReminderAt}
        nextAmount={confirmation?.nextAmount}
        done={confirmation?.done}
        cycleAnchorAt={confirmation?.cycleAnchorAt}
        freeMode={freeMode}
        onClose={() => setConfirmation(null)}
      />
      <RecentContributionModal
        visible={pendingContribution?.stage === 'recent'}
        amount={pendingContribution?.amount ?? 0}
        contributions={pendingContribution?.recent ?? []}
        onClose={() => setPendingContribution(null)}
        onConfirm={() => {
          const pendingDeposit = pendingContribution;
          if (!pendingDeposit) return;
          if (pendingDeposit.choiceAnchorAt) {
            setPendingContribution({ ...pendingDeposit, stage: 'choice' });
          } else {
            setPendingContribution(null);
            void performConfirm(pendingDeposit.amount, pendingDeposit.source);
          }
        }}
      />
      <ContributionChoiceModal
        visible={pendingContribution?.stage === 'choice'}
        anchorAt={pendingContribution?.choiceAnchorAt}
        value={pendingContribution?.intent ?? 'surplus'}
        onChange={(intent) =>
          setPendingContribution((current) => (current ? { ...current, intent } : current))
        }
        onClose={() => setPendingContribution(null)}
        onConfirm={() => {
          const pendingDeposit = pendingContribution;
          setPendingContribution(null);
          if (pendingDeposit) {
            void performConfirm(
              pendingDeposit.amount,
              pendingDeposit.source,
              pendingDeposit.intent
            );
          }
        }}
      />
      <ActionLoadingOverlay
        visible={actionLoading}
        title="Enregistrement du versement…"
        detail="Mise à jour de la progression et du prochain rappel."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.banner,
    borderRadius: radius.field,
    padding: 14,
    marginBottom: 14,
  },
  bannerText: { color: colors.accent, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  savedMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  savingsLocation: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: 17,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 8,
  },
  savingsLocationPressed: { opacity: 0.72 },
  savingsLocationLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  savingsLocationValue: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  savingsLocationArrow: { color: colors.accent, fontSize: 18, lineHeight: 18, fontWeight: '700' },
  amountAside: { alignItems: 'flex-end', paddingBottom: 3, flexShrink: 1, minWidth: 0, maxWidth: '55%' },
  remainingAmount: { fontSize: 14, fontWeight: '800', color: colors.text },
  targetAmount: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  progressFooter: { alignItems: 'center', gap: 3 },
  targetDate: { fontSize: 13, fontWeight: '800', color: colors.text, textAlign: 'center' },
  capacityWarning: {
    backgroundColor: colors.banner,
    borderRadius: radius.field,
    padding: 14,
    marginBottom: 14,
  },
  capacityWarningText: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  reviewBanner: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    padding: 14,
    gap: 8,
    marginBottom: 14,
  },
  reviewTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  reviewText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  reviewButtons: { flexDirection: 'row', gap: 10, marginTop: 2 },
  balanceCheckCard: {
    backgroundColor: colors.cardSoft,
    borderRadius: radius.field,
    padding: 14,
    gap: 8,
    marginTop: 14,
  },
  balanceCheckTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  balanceCheckText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  plannedCard: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    padding: 16,
  },
  plannedTitle: { color: colors.text, fontSize: 20, fontWeight: '800', lineHeight: 25 },
  plannedBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 7 },
  plannedNote: { color: colors.accent, fontSize: 13, fontWeight: '800', marginTop: 10 },
  balanceActionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonPressed: { backgroundColor: colors.cardSoft },
  infoButtonText: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.accent,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.button,
    padding: 6,
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent },
  tabLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  tabLabelActive: { color: '#FFFFFF' },
  adviceCard: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: 20,
    padding: 15,
    marginBottom: 13,
  },
  adviceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  adviceAmount: { fontSize: 38, fontWeight: '800', color: colors.text, marginVertical: 3 },
  adviceFreeAmount: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 6,
  },
  adviceReminder: { fontSize: 14, fontWeight: '600', color: colors.text },
  reminderDayLink: { alignSelf: 'flex-start', paddingTop: 10, paddingVertical: 4 },
  reminderDayLinkText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  nudgeSetting: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardSoftBorder,
    marginTop: 12,
    paddingTop: 12,
  },
  nudgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nudgeCopy: { flex: 1, minWidth: 0 },
  nudgeTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  nudgeText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  nudgePreview: { alignSelf: 'flex-start', marginTop: 10 },
  nudgePreviewPressed: { opacity: 0.6 },
  nudgePreviewLabel: { color: colors.accent, fontSize: 13, fontWeight: '800' },
  previewSchedule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 18,
    paddingTop: 16,
  },
  previewTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
  },
  previewDate: { fontSize: 15, fontWeight: '700', color: colors.text },
  previewMeta: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 1 },
  previewAmount: { fontSize: 15, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  reachedTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 8 },
  reachedBody: { fontSize: 16, color: colors.textSecondary, lineHeight: 23 },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scheduleDate: { fontSize: 17, fontWeight: '700', color: colors.text },
  scheduleNext: { fontSize: 13, fontWeight: '600', color: colors.accent, marginTop: 2 },
  scheduleAmount: { fontSize: 17, fontWeight: '800', color: colors.text },
});
