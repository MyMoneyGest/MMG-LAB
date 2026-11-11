import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { REMINDER_HOURS, reminderTimeLabel } from '@/lib/plan';
import { Button, Field, KeyboardSafeScrollView } from './ui';

export function ReminderDayModal({
  visible,
  currentDay,
  currentHour,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  currentDay: number;
  currentHour: number;
  onConfirm: (day: number, hour: number) => Promise<void> | void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(currentDay));
  const [hour, setHour] = useState(currentHour);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setValue(String(currentDay));
    setHour(currentHour);
    setError(null);
    setSaving(false);
  }, [visible, currentDay, currentHour]);

  const submit = async () => {
    const day = Number(value);
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      setError('Entre un jour compris entre 1 et 28.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(day, hour);
    } finally {
      setSaving(false);
    }
  };

  /**
   * L'heure du projet peut venir d'ailleurs que de la liste (restauration,
   * version future) : on l'ajoute alors aux choix plutôt que de la perdre
   * silencieusement en ouvrant ce modal.
   */
  const hours = REMINDER_HOURS.includes(currentHour as (typeof REMINDER_HOURS)[number])
    ? [...REMINDER_HOURS]
    : [...REMINDER_HOURS, currentHour].sort((a, b) => a - b);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardSafeScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable accessibilityViewIsModal style={styles.sheet} onPress={() => {}}>
              <Text style={styles.eyebrow}>Rappel mensuel</Text>
              <Text style={styles.title}>Quand te prévenir ?</Text>
              <Field
                label="Jour du mois (1 à 28)"
                value={value}
                onChangeText={(text) => {
                  setValue(text.replace(/\D/g, '').slice(0, 2));
                  setError(null);
                }}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
                error={error}
              />
              {/* L'heure est ici, contre le jour : c'est la même décision, et
                  l'enfouir ailleurs la rendrait introuvable. Des pastilles
                  plutôt qu'un champ libre — on choisit un moment de la journée,
                  pas une valeur entre 0 et 23. */}
              <Text style={styles.hourLabel}>Heure</Text>
              <View style={styles.hourRow}>
                {hours.map((h) => {
                  const selected = h === hour;
                  return (
                    <Pressable
                      key={h}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Rappel à ${reminderTimeLabel(h)}`}
                      onPress={() => setHour(h)}
                      style={[styles.hourChip, selected && styles.hourChipSelected]}>
                      <Text style={[styles.hourChipText, selected && styles.hourChipTextSelected]}>
                        {reminderTimeLabel(h)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.buttons}>
                <Button
                  label="Annuler"
                  variant="secondary"
                  onPress={onClose}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Valider"
                  onPress={() => void submit()}
                  loading={saving}
                  loadingLabel="Mise à jour…"
                  style={{ flex: 1 }}
                />
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
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
  },
  sheet: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20 },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 14 },
  hourLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  // `wrap` plutôt qu'un défilement horizontal : cinq pastilles tiennent sur
  // deux lignes même sur un petit écran, et rien ne se cache hors du cadre.
  hourRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  hourChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourChipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  hourChipText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  hourChipTextSelected: { color: colors.card },
  buttons: { flexDirection: 'row', gap: 10 },
});
