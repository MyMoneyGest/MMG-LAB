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
import { formatDate, formatDayMonth, parseDateInput } from '@/lib/format';
import {
  canPostponeReminderTo,
  nextRegularReminderAfterCurrent,
  postponeDateLimit,
  postponeIsNearNextAnchor,
} from '@/lib/plan';
import { Goal } from '@/lib/types';
import { Button, DateField, KeyboardSafeScrollView } from './ui';

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
  const [dateText, setDateText] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const latestDate = postponeDateLimit(goal);
  const nextRegularDate = nextRegularReminderAfterCurrent(goal);
  const anchorHasArrived = postponeIsNearNextAnchor(goal, latestDate);
  const dateLimitError = anchorHasArrived
    ? `Choisis une date au plus tard le ${formatDate(latestDate)}, la veille du prochain rappel mensuel.`
    : `Avant le jour du rappel, tu peux reporter au plus tard au ${formatDate(latestDate)}. Tu pourras aller au-delà lorsque ce jour arrivera.`;

  useEffect(() => {
    if (visible) {
      setDateText('');
      setSelectedDate(null);
      setError(null);
      setSaving(false);
    }
  }, [visible]);

  const apply = async (date: Date) => {
    if (!canPostponeReminderTo(goal, date)) {
      setError(dateLimitError);
      return;
    }
    setSaving(true);
    try {
      const result = await postponeReminder(goal, date, {
        source: isTestAction ? 'test_notification' : 'app',
      });
      if (!result.ok) {
        setError(result.reason === 'permission' ? PERMISSION_ERROR : dateLimitError);
        return;
      }
      onDone();
    } finally {
      setSaving(false);
    }
  };

  const chooseDate = (date: Date) => {
    if (!canPostponeReminderTo(goal, date)) {
      setError(dateLimitError);
      return;
    }
    setSelectedDate(date);
    setDateText(formatDate(date));
    setError(null);
  };

  const applyPrecise = () => {
    const parsed = parseDateInput(dateText);
    if (!parsed) {
      setError('Date invalide. Format attendu : JJ/MM/AAAA.');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed <= today) {
      setError('Choisis une date à venir.');
      return;
    }
    setSelectedDate(parsed);
    void apply(parsed);
  };

  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  const quickOptions: { label: string; date: Date }[] = [
    { label: 'Demain', date: inDays(1) },
    { label: 'Dans 3 jours', date: inDays(3) },
    { label: 'Dans 7 jours', date: inDays(7) },
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
                {anchorHasArrived
                  ? `Report possible jusqu'au ${formatDayMonth(latestDate)}, la veille du prochain rappel du ${formatDayMonth(nextRegularDate)}.`
                  : `Ton rappel n'est pas encore arrivé. Pour le moment, tu peux choisir une date jusqu'au ${formatDayMonth(latestDate)} inclus.`}
              </Text>

              {quickOptions.map((opt) => (
                <Pressable key={opt.label} style={styles.option} onPress={() => chooseDate(opt.date)}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionDate}>{formatDayMonth(opt.date)}</Text>
                </Pressable>
              ))}

              <Text style={styles.fieldTitle}>Date précise</Text>
              <DateField
                value={dateText}
                onChangeText={(t) => {
                  setDateText(t);
                  setSelectedDate(parseDateInput(t));
                  setError(null);
                }}
              />
              {selectedDate && postponeIsNearNextAnchor(goal, selectedDate) ? (
                <Text style={styles.info}>
                  Votre prochain rappel régulier reste prévu le {formatDate(nextRegularDate)}.
                </Text>
              ) : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.buttons}>
                <Button label="Annuler" variant="secondary" onPress={onClose} disabled={saving} style={{ flex: 0.8 }} />
                <Button label="Valider la date" onPress={applyPrecise} loading={saving} style={{ flex: 1.2 }} />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardSafeScrollView>
      </KeyboardAvoidingView>
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
