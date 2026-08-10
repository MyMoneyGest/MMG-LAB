import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { Button, Field, KeyboardSafeScrollView } from './ui';

const MAX_LOCATION_LENGTH = 48;

export function SavingsLocationModal({
  visible,
  currentLocation,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  currentLocation?: string;
  onConfirm: (location?: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentLocation ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setValue(currentLocation ?? '');
    setSaving(false);
  }, [visible, currentLocation]);

  const submit = async () => {
    if (saving) return;
    const location = value.trim().replace(/\s+/g, ' ') || undefined;
    setSaving(true);
    try {
      await onConfirm(location);
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
              <Text style={styles.eyebrow}>Repère facultatif</Text>
              <Text style={styles.title}>Où gardes-tu cette épargne ?</Text>
              <Text style={styles.body}>
                Indique simplement le compte ou le moyen utilisé. Ce repère reste uniquement
                sur ton téléphone.
              </Text>
              <Field
                label="Compte ou support"
                value={value}
                onChangeText={(text) => setValue(text.slice(0, MAX_LOCATION_LENGTH))}
                placeholder="Ex. Compte épargne, mobile money, espèces"
                autoCapitalize="sentences"
                autoCorrect
                autoFocus
                maxLength={MAX_LOCATION_LENGTH}
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
              />
              {currentLocation ? (
                <Text style={styles.note}>Laisse le champ vide pour retirer ce repère.</Text>
              ) : null}
              <View style={styles.buttons}>
                <Button
                  label="Annuler"
                  variant="secondary"
                  onPress={onClose}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Enregistrer"
                  onPress={() => void submit()}
                  loading={saving}
                  loadingLabel="Enregistrement…"
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
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 23, lineHeight: 28, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  note: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: -3 },
  buttons: { flexDirection: 'row', gap: 10 },
});
