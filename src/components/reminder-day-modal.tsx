import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { Button, Field, KeyboardSafeScrollView } from './ui';

export function ReminderDayModal({
  visible,
  currentDay,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  currentDay: number;
  onConfirm: (day: number) => Promise<void> | void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(currentDay));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setValue(String(currentDay));
    setError(null);
    setSaving(false);
  }, [visible, currentDay]);

  const submit = async () => {
    const day = Number(value);
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      setError('Entre un jour compris entre 1 et 28.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(day);
    } finally {
      setSaving(false);
    }
  };

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
              <Text style={styles.title}>Nouveau jour</Text>
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
  buttons: { flexDirection: 'row', gap: 10 },
});
