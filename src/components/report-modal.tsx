import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { postponeReminder } from '@/lib/actions';
import { formatDayMonth, parseDateInput } from '@/lib/format';
import { Goal } from '@/lib/types';
import { Button, Field } from './ui';

// Report du rappel : « Quand te le rappeler ? » — Demain / 3 jours / 7 jours
// ou date précise. Échoue proprement si la permission de notification manque.

const PERMISSION_ERROR = 'Report impossible pour le moment. Vérifie les permissions de notification.';

export function ReportModal({
  visible,
  goal,
  onClose,
  onDone,
}: {
  visible: boolean;
  goal: Goal;
  onClose: () => void;
  onDone: () => void;
}) {
  const [dateText, setDateText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDateText('');
      setError(null);
    }
  }, [visible]);

  const apply = async (date: Date) => {
    const result = await postponeReminder(goal, date);
    if (!result.ok) {
      setError(PERMISSION_ERROR);
      return;
    }
    onDone();
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
    apply(parsed);
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
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.eyebrow}>Report</Text>
          <Text style={styles.title}>Quand te le rappeler ?</Text>
          <Text style={styles.subtitle}>Choisis une date qui colle à ton vrai rythme.</Text>

          {quickOptions.map((opt) => (
            <Pressable key={opt.label} style={styles.option} onPress={() => apply(opt.date)}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionDate}>{formatDayMonth(opt.date)}</Text>
            </Pressable>
          ))}

          <Text style={styles.fieldTitle}>Date précise</Text>
          <Field
            value={dateText}
            onChangeText={(t) => {
              setDateText(t);
              setError(null);
            }}
            placeholder="JJ/MM/AAAA"
            keyboardType="numbers-and-punctuation"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.buttons}>
            <Button label="Annuler" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Valider la date" onPress={applyPrecise} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
    justifyContent: 'flex-start',
    padding: 16,
    paddingTop: 90,
  },
  sheet: { backgroundColor: colors.card, borderRadius: radius.card, padding: 22 },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 16 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  optionLabel: { fontSize: 17, fontWeight: '700', color: colors.text },
  optionDate: { fontSize: 17, fontWeight: '700', color: colors.accent },
  fieldTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8, marginBottom: 8 },
  error: { color: colors.accent, fontSize: 15, fontWeight: '600', marginBottom: 10 },
  buttons: { flexDirection: 'row', gap: 12 },
});
