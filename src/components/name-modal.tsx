import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { Button, Field, KeyboardSafeScrollView } from './ui';

// Le prénom se saisit au premier lancement, à côté de « Bienvenue ». Sans ce
// modal il n'était plus modifiable ensuite : l'écran d'accueil ne se revoit
// pas, et l'écran « Pays et devise » ne propose pas le champ.
//
// Il sert uniquement à l'accueil de l'app (« Bonjour, X ») et aux messages de
// relance. Il reste sur le téléphone et n'est jamais transmis au suivi.

const MAX_NAME_LENGTH = 24;

export function NameModal({
  visible,
  currentName,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  currentName?: string;
  onConfirm: (name?: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentName ?? '');

  // Rouvrir repart de la valeur enregistrée, pas d'une saisie abandonnée.
  useEffect(() => {
    if (!visible) return;
    setValue(currentName ?? '');
  }, [visible, currentName]);

  const submit = () => {
    onConfirm(value.trim().replace(/\s+/g, ' ') || undefined);
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
              <Text style={styles.eyebrow}>Facultatif</Text>
              <Text style={styles.title}>Comment veux-tu qu'on t'appelle ?</Text>
              <Text style={styles.body}>
                Ce prénom sert à t'accueillir dans l'application. Il reste sur ton téléphone.
              </Text>
              <Field
                label="Prénom ou pseudo"
                value={value}
                onChangeText={(text) => setValue(text.slice(0, MAX_NAME_LENGTH))}
                placeholder="Ex. Patrick"
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                maxLength={MAX_NAME_LENGTH}
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              {currentName ? (
                <Text style={styles.note}>
                  Laisse le champ vide pour revenir à un accueil sans prénom.
                </Text>
              ) : null}
              <View style={styles.buttons}>
                <Button
                  label="Annuler"
                  variant="secondary"
                  onPress={onClose}
                  style={{ flex: 1 }}
                />
                <Button label="Enregistrer" onPress={submit} style={{ flex: 1 }} />
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
