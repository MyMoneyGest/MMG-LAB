import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AmountModal } from '@/components/amount-modal';
import { AppHeader } from '@/components/app-header';
import { BalanceModal } from '@/components/balance-modal';
import { ConfirmationOverlay } from '@/components/confirmation-overlay';
import { ContributionChoiceModal } from '@/components/contribution-choice-modal';
import { ReportModal } from '@/components/report-modal';
import { RecentContributionModal } from '@/components/recent-contribution-modal';
import { RebalanceModal } from '@/components/rebalance-modal';
import { ReminderDayModal } from '@/components/reminder-day-modal';
import { Button, Card, Eyebrow, ProgressBar, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import {
  applyGlobalRebalance,
  changeReminderDay,
  clearGlobalRebalanceReview,
  confirmContribution,
  deferGlobalRebalance,
  reconcileGlobalBalance,
} from '@/lib/actions';
import type { ContributionSource } from '@/lib/actions';
import { formatDate, formatEuro } from '@/lib/format';
import { hasNotificationPermission, notificationsSupported } from '@/lib/notifications';
import {
  hasPendingAction,
  balanceCheckDue,
  buildGlobalRebalanceProposal,
  contributionPlan,
  currentUpcomingCycle,
  estimatedGlobalBalance,
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
import { CATEGORY_DESCRIPTIONS } from '@/lib/types';
import type { Contribution } from '@/lib/types';
import type { RebalanceReason } from '@/lib/types';

type Tab = 'today' | 'schedule' | 'history';

const TABS: { key: Tab; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'schedule', label: 'Échéancier' },
  { key: 'history', label: 'Historique' },
];

const handledNotificationActions = new Set<string>();

export default function GoalScreen() {
  const { id, notificationAction, notificationIsTest, responseKey } = useLocalSearchParams<{
    id: string;
    notificationAction?: 'done' | 'edit' | 'postpone';
    notificationIsTest?: string;
    responseKey?: string;
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
  const [rebalanceProposal, setRebalanceProposal] =
    useState<GlobalRebalanceProposal | null>(null);
  const [rebalanceReason, setRebalanceReason] =
    useState<RebalanceReason | 'review'>('balance');
  const [reportOpen, setReportOpen] = useState(false);
  const [reminderDayOpen, setReminderDayOpen] = useState(false);
  const [modalFromTest, setModalFromTest] = useState(false);
  const [notifBlocked, setNotifBlocked] = useState(false);
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
    const plan = await confirmContribution(currentGoal, amount, source, intent);
    const updated = useStore.getState().goals.find((g) => g.id === goal.id);
    setConfirmation({
      amount,
      nextReminderAt: updated?.nextReminderAt,
      nextAmount: updated ? suggestedAmount(updated) : undefined,
      done: updated ? remainingAmount(updated) <= 0 : false,
      cycleAnchorAt: plan.cycleAnchorAt,
    });
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
      const amount = suggestedAmount(goal);
      if (amount > 0) {
        confirm(amount, notificationIsTest === '1' ? 'test_notification' : 'one_tap');
      }
    }
  }, [goal?.id, notificationAction, notificationIsTest, responseKey]);

  if (!hydrated) return null;
  if (!goal) return <Redirect href="/" />;

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

  return (
    <Screen>
      <AppHeader showBack currentGoalId={goal.id} />

      {notifBlocked ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Rappel de test impossible : autorise les notifications pour MMG.
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
            Au mois le plus exigeant, tes plans demandent {formatEuro(globalPlan.currentEffort)},
            mais ta capacité prudente globale est de {formatEuro(globalPlan.capacity)}. Un
            réajustement est recommandé.
          </Text>
        </View>
      ) : null}

      <Card>
        <Eyebrow>Ton plan actuel</Eyebrow>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Text style={styles.goalDescription}>{CATEGORY_DESCRIPTIONS[goal.category]}</Text>
        <ProgressBar pct={pct} />
        <View style={styles.statsRow}>
          <Text style={styles.statAccent}>{pct} % atteint</Text>
          <Text style={styles.stat}>{formatEuro(saved)} estimés</Text>
          <Text style={styles.stat}>{formatEuro(remaining)} restants</Text>
        </View>
        <Text style={styles.targetDate}>Cible {formatDate(goal.targetDate)}</Text>
        <Text style={styles.balanceStatus}>
          {latestSnapshot
            ? `Solde global confirmé le ${formatDate(latestSnapshot.date)}`
            : 'Solde global pas encore confirmé'}
        </Text>
      </Card>

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'today' ? (
        <Card>
          <Eyebrow>Action du mois</Eyebrow>
          {reached ? (
            <>
              <Text style={styles.reachedTitle}>Objectif atteint 🎉</Text>
              <Text style={styles.reachedBody}>
                « {goal.name} » est financé. Tu peux créer un nouveau projet depuis le menu.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.adviceCard}>
                <Text style={styles.adviceLabel}>Montant conseillé</Text>
                <Text style={styles.adviceAmount}>{formatEuro(suggested)}</Text>
                <Text style={styles.adviceReminder}>
                  {pending ? 'Rappel en cours : ' : 'Rappel prévu : '}
                  {formatDate(goal.nextReminderAt)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setReminderDayOpen(true)}
                  style={styles.reminderDayLink}>
                  <Text style={styles.reminderDayLinkText}>
                    Jour mensuel : le {goal.reminderDay} · Modifier
                  </Text>
                </Pressable>
              </View>
              <View style={{ gap: 12 }}>
                <Button
                  label={`Versement fait (${formatEuro(suggested)})`}
                  onPress={() => confirm(suggested, 'one_tap')}
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
            </>
          )}
          <Button
            label="Mettre à jour le solde réel"
            variant="secondary"
            onPress={() => setBalanceOpen(true)}
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : null}

      {tab === 'schedule' ? (
        <Card>
          <Eyebrow>Échéancier</Eyebrow>
          {reached ? (
            <Text style={styles.reachedBody}>Aucune échéance à venir : objectif atteint.</Text>
          ) : (
            upcomingSchedule(goal).map((row, index) => (
              <View key={row.date.toISOString()} style={styles.scheduleRow}>
                <View>
                  <Text style={styles.scheduleDate}>{formatDate(row.date)}</Text>
                  {index === 0 ? <Text style={styles.scheduleNext}>Prochain rappel</Text> : null}
                </View>
                <Text style={styles.scheduleAmount}>{formatEuro(row.amount)}</Text>
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
                    {formatEuro(c.amount)}
                  </Text>
                </View>
              ))
          )}
        </Card>
      ) : null}

      <AmountModal
        visible={amountModal === 'deposit'}
        title="Montant différent"
        subtitle="N'importe quel montant compte : le plan s'ajustera."
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
      <BalanceModal
        visible={balanceOpen}
        estimatedBalance={globalBalance}
        lastConfirmedAt={latestSnapshot?.date}
        onClose={() => setBalanceOpen(false)}
        onConfirm={async (amount) => {
          const proposal = await reconcileGlobalBalance(amount);
          setBalanceOpen(false);
          if (proposal && (proposal.goals.length || !proposal.possible)) {
            setRebalanceReason('balance');
            setRebalanceProposal(proposal);
          } else {
            clearGlobalRebalanceReview();
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
          await applyGlobalRebalance(rebalanceProposal);
          setRebalanceProposal(null);
        }}
      />
      <ReminderDayModal
        visible={reminderDayOpen}
        currentDay={goal.reminderDay}
        onClose={() => setReminderDayOpen(false)}
        onConfirm={async (day) => {
          const currentGoal = useStore
            .getState()
            .goals.find((candidate) => candidate.id === goal.id);
          if (!currentGoal) return;
          await changeReminderDay(currentGoal, day);
          setReminderDayOpen(false);
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
  goalName: { fontSize: 34, fontWeight: '800', color: colors.text, marginBottom: 8 },
  goalDescription: { fontSize: 17, color: colors.textSecondary, lineHeight: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  statAccent: { fontSize: 15, fontWeight: '800', color: colors.accent },
  stat: { fontSize: 15, fontWeight: '700', color: colors.text },
  targetDate: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 10 },
  balanceStatus: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.button,
    padding: 6,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  tabActive: { backgroundColor: colors.dark },
  tabLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  tabLabelActive: { color: colors.textOnDark },
  adviceCard: {
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  adviceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  adviceAmount: { fontSize: 42, fontWeight: '800', color: colors.text, marginVertical: 4 },
  adviceReminder: { fontSize: 15, fontWeight: '600', color: colors.text },
  reminderDayLink: { alignSelf: 'flex-start', paddingTop: 10, paddingVertical: 4 },
  reminderDayLinkText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
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
