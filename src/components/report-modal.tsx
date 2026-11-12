import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius } from '@/constants/theme';
import { postponeReminder } from '@/lib/actions';
import { hapticSettingApplied } from '@/lib/haptics';
import { formatDate, formatDayMonth } from '@/lib/format';
import {
  canPostponeReminderTo,
  nextRegularReminderAfterCurrent,
  postponeDateFloor,
  postponeDateLimit,
  postponeIsNearNextAnchor,
} from '@/lib/plan';
import { Goal } from '@/lib/types';
import { MIN_INLINE_LOADING_MS, waitForMinimumLoading } from '@/lib/timing';
import { Button, DatePickerField, KeyboardSafeScrollView } from './ui';
import { CalendarModal } from './calendar-modal';

// Report du rappel : « Quand te le rappeler ? » — Demain / 3 jours / 7 jours
// ou date précise. Échoue proprement si la permission de notification manque.

const PERMISSION_ERROR = 'Report impossible pour le moment. Vérifie les permissions de notification.';

export function ReportModal({
  visible,
  goal,
  onClose,
  onDone,
  isTestAction = false,
}: {
  visible: boolean;
  goal: Goal;
  onClose: () => void;
  onDone: () => void;
  isTestAction?: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const latestDate = postponeDateLimit(goal);
  // Un report ne peut que repousser : le plancher est la date à laquelle le
  // rappel est déjà prévu. Sans lui, « dans 7 jours » appliqué à un cycle dont
  // l'ancre est à un mois ramenait le rappel un mois plus tôt.
  const earliestDate = postponeDateFloor(goal);
  const nextRegularDate = nextRegularReminderAfterCurrent(goal);
  // Le rappel visé n'est pas forcément arrivé : on peut décaler une échéance
  // qu'on sait déjà ne pas pouvoir tenir. Le plancher est alors dans le futur,
  // et le message doit donner les deux bornes plutôt que la seule limite.
  const floorIsAhead = earliestDate.getTime() > Date.now();
  const dateLimitError = floorIsAhead
    ? `Ce rappel est prévu le ${formatDate(earliestDate)} : choisis une date après celle-ci et au plus tard le ${formatDate(latestDate)}.`
    : `Choisis une date au plus tard le ${formatDate(latestDate)}, la veille du prochain rappel mensuel.`;

  useEffect(() => {
    if (visible) {
      setSelectedDate(null);
      setCalendarOpen(false);
      setError(null);
      setSaving(false);
    }
  }, [visible]);

  const apply = async (date: Date) => {
    if (!canPostponeReminderTo(goal, date)) {
      setError(dateLimitError);
      return;
    }
    const loadingStartedAt = Date.now();
    setSaving(true);
    try {
      const result = await postponeReminder(goal, date, {
        source: isTestAction ? 'test_notification' : 'app',
      });
      await waitForMinimumLoading(loadingStartedAt, MIN_INLINE_LOADING_MS);
      if (!result.ok) {
        setError(result.reason === 'permission' ? PERMISSION_ERROR : dateLimitError);
        return;
      }
      // Sur le seul chemin de succès : un report refusé ne doit rien confirmer.
      hapticSettingApplied();
      onDone();
    } finally {
      await waitForMinimumLoading(loadingStartedAt, MIN_INLINE_LOADING_MS);
      setSaving(false);
    }
  };

  const chooseDate = (date: Date) => {
    if (!canPostponeReminderTo(goal, date)) {
      setError(dateLimitError);
      return;
    }
    setSelectedDate(date);
    setError(null);
  };

  const applyPrecise = () => {
    if (!selectedDate) {
      setError('Choisis une date dans le calendrier.');
      return;
    }
    void apply(selectedDate);
  };

  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  // Les raccourcis se comptent À PARTIR DU RAPPEL, pas d'aujourd'hui. Comptés
  // depuis aujourd'hui, « dans 7 jours » appliqué à un rappel prévu dans trois
  // semaines proposait une date antérieure au rappel lui-même — soit refusée,
  // soit, avant le correctif du plancher, un rappel ramené en arrière.
  const afterReminder = (n: number) => {
    const d = new Date(earliestDate);
    d.setDate(d.getDate() + n);
    return d;
  };

  const quickOptions: { label: string; date: Date }[] = [
    { label: '+ 1 jour', date: afterReminder(1) },
    { label: '+ 3 jours', date: afterReminder(3) },
    { label: '+ 7 jours', date: afterReminder(7) },
  ].filter((option) => canPostponeReminderTo(goal, option.date));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardSafeScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={process.env.EXPO_OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <Text style={styles.eyebrow}>Report</Text>
              <Text style={styles.title}>Quand te le rappeler ?</Text>
              <Text style={styles.subtitle}>
                {floorIsAhead
                  ? `Ton rappel est prévu le ${formatDayMonth(earliestDate)}. Tu peux le décaler jusqu'au ${formatDayMonth(latestDate)}, la veille du rappel suivant.`
                  : `Report possible jusqu'au ${formatDayMonth(latestDate)}, la veille du prochain rappel du ${formatDayMonth(nextRegularDate)}.`}
              </Text>

              {quickOptions.map((opt) => (
                <Pressable key={opt.label} style={styles.option} onPress={() => chooseDate(opt.date)}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionDate}>{formatDayMonth(opt.date)}</Text>
                </Pressable>
              ))}

              <Text style={styles.fieldTitle}>Date précise</Text>
              <DatePickerField
                value={selectedDate}
                onPress={() => setCalendarOpen(true)}
              />
              {selectedDate && postponeIsNearNextAnchor(goal, selectedDate) ? (
                <Text style={styles.info}>
                  Votre prochain rappel régulier reste prévu le {formatDate(nextRegularDate)}.
                </Text>
              ) : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.buttons}>
                <Button label="Annuler" variant="secondary" onPress={onClose} disabled={saving} style={{ flex: 0.8 }} />
                <Button
                  label="Valider la date"
                  onPress={applyPrecise}
                  loading={saving}
                  loadingLabel="Programmation…"
                  style={{ flex: 1.2 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardSafeScrollView>
      </KeyboardAvoidingView>
      <CalendarModal
        visible={calendarOpen}
        value={selectedDate}
        title="Reporter au"
        minDate={earliestDate > inDays(1) ? earliestDate : inDays(1)}
        maxDate={latestDate}
        onSelect={(date) => {
          chooseDate(date);
          setCalendarOpen(false);
        }}
        onClose={() => setCalendarOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18 },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 13 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 8,
  },
  optionLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionDate: { fontSize: 15, fontWeight: '700', color: colors.accent },
  fieldTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 6, marginBottom: 6 },
  error: { color: colors.accent, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  info: {
    color: colors.textSecondary,
    backgroundColor: colors.cardSoft,
    borderRadius: radius.field,
    padding: 10,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  buttons: { flexDirection: 'row', gap: 10 },
});
