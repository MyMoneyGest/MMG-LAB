import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AmountModal } from '@/components/amount-modal';
import { AppHeader } from '@/components/app-header';
import { ConfirmationOverlay } from '@/components/confirmation-overlay';
import { ReportModal } from '@/components/report-modal';
import { Button, Card, Eyebrow, ProgressBar, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { confirmContribution, withdraw } from '@/lib/actions';
import { formatDate, formatEuro } from '@/lib/format';
import { hasNotificationPermission, notificationsSupported } from '@/lib/notifications';
import {
  hasPendingAction,
  progressPct,
  remainingAmount,
  savedTotal,
  suggestedAmount,
  upcomingSchedule,
} from '@/lib/plan';
import { useStore } from '@/lib/store';
import { CATEGORY_DESCRIPTIONS } from '@/lib/types';

type Tab = 'today' | 'schedule' | 'history';

const TABS: { key: Tab; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'schedule', label: 'Échéancier' },
  { key: 'history', label: 'Historique' },
];

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useStore((s) => s.goals.find((g) => g.id === id));
  const setLastViewed = useStore((s) => s.setLastViewed);

  const [tab, setTab] = useState<Tab>('today');
  const [amountModal, setAmountModal] = useState<'deposit' | 'withdrawal' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    amount: number;
    nextReminderAt?: string;
    nextAmount?: number;
    done: boolean;
  } | null>(null);

  useEffect(() => {
    if (goal) setLastViewed(goal.id);
  }, [goal?.id]);

  useEffect(() => {
    if (!notificationsSupported) return; // web : pas de rappels, pas de bannière
    hasNotificationPermission().then((granted) => setNotifBlocked(!granted));
  }, []);

  if (!goal) return <Redirect href="/" />;

  const saved = savedTotal(goal);
  const remaining = remainingAmount(goal);
  const pct = progressPct(goal);
  const suggested = suggestedAmount(goal);
  const reached = remaining <= 0;
  const pending = hasPendingAction(goal);

  const confirm = async (amount: number, source: 'one_tap' | 'custom_amount') => {
    setAmountModal(null);
    await confirmContribution(goal, amount, source);
    const updated = useStore.getState().goals.find((g) => g.id === goal.id);
    setConfirmation({
      amount,
      nextReminderAt: updated?.nextReminderAt,
      nextAmount: updated ? suggestedAmount(updated) : undefined,
      done: updated ? remainingAmount(updated) <= 0 : false,
    });
  };

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

      <Card>
        <Eyebrow>Ton plan actuel</Eyebrow>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Text style={styles.goalDescription}>{CATEGORY_DESCRIPTIONS[goal.category]}</Text>
        <ProgressBar pct={pct} />
        <View style={styles.statsRow}>
          <Text style={styles.statAccent}>{pct} % atteint</Text>
          <Text style={styles.stat}>{formatEuro(saved)} déjà mis</Text>
          <Text style={styles.stat}>{formatEuro(remaining)} restants</Text>
        </View>
        <Text style={styles.targetDate}>Cible {formatDate(goal.targetDate)}</Text>
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
                    onPress={() => setAmountModal('deposit')}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Reporter"
                    variant="secondary"
                    onPress={() => setReportOpen(true)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </>
          )}
          {saved > 0 ? (
            <Button
              label="Retrait"
              variant="secondary"
              onPress={() => setAmountModal('withdrawal')}
              style={{ marginTop: 12 }}
            />
          ) : null}
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
        onConfirm={(amount) => confirm(amount, 'custom_amount')}
        onClose={() => setAmountModal(null)}
      />
      <AmountModal
        visible={amountModal === 'withdrawal'}
        title="Retrait"
        subtitle="À noter si tu as dû repiocher dedans — sans jugement, le plan se recale."
        confirmLabel="Valider le retrait"
        maxAmount={saved}
        onConfirm={async (amount) => {
          setAmountModal(null);
          await withdraw(goal, amount);
        }}
        onClose={() => setAmountModal(null)}
      />
      <ReportModal
        visible={reportOpen}
        goal={goal}
        onClose={() => setReportOpen(false)}
        onDone={() => setReportOpen(false)}
      />
      <ConfirmationOverlay
        visible={confirmation !== null}
        amount={confirmation?.amount ?? 0}
        goalName={goal.name}
        nextReminderAt={confirmation?.nextReminderAt}
        nextAmount={confirmation?.nextAmount}
        done={confirmation?.done}
        onClose={() => setConfirmation(null)}
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
