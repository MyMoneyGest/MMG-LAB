import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/constants/theme';
import { CountryList } from './country-list';

// Sélecteur de pays en vrai bottom sheet, pour le premier lancement : sépare
// le choix du pays de l'écran principal, pour que son bouton "Continuer" ne
// soit plus jamais poussé par une liste qui s'étend en accordéon.
//
// L'écran de réglages, lui, affiche la même liste (CountryList) à plat : on y
// vient pour changer de pays, pas pour lire une page d'accueil.
//
// Choisir une ligne vaut confirmation : pas d'état intermédiaire ni de
// bouton « Confirmer » (le choix reste réversible en rouvrant la feuille,
// et l'écran appelant garde son propre bouton de validation).

export function CountryPickerModal({
  visible,
  selectedCode,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  selectedCode: string;
  onConfirm: (code: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}
          onPress={() => {}}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.title}>Choisir un pays</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}>
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>

          <CountryList selectedCode={selectedCode} onSelect={onConfirm} resetKey={visible} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '86%',
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.text },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textSecondary },
});
