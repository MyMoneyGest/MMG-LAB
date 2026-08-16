import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';

// Message d'erreur de saisie en pop-up flottante, qui s'efface d'elle-même.
// Contrairement au texte d'erreur inline, elle reste visible même quand le
// champ fautif est hors écran, et n'entre pas dans le flux de la carte (donc
// n'en décale pas la mise en page ni la position du bouton).
//
// Passe par un Modal (comme ActionLoadingOverlay) : les écrans rendent leur
// contenu dans un ScrollView, où un `position: absolute` se placerait par
// rapport au contenu défilant et non à l'écran visible.
//
// La `key` posée par l'appelant change à chaque signalement, ce qui rejoue
// l'animation et relance le minuteur même si le texte est identique.

export function ErrorToast({
  message,
  onFinished,
  duration = 3600,
}: {
  message: string;
  onFinished: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onFinished, duration);
    return () => clearTimeout(timer);
  }, [duration, message, onFinished]);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View
        pointerEvents="none"
        entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
        exiting={FadeOut.duration(200).reduceMotion(ReduceMotion.System)}
        style={styles.wrap}>
        <View accessibilityRole="alert" style={styles.toast}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.text}>{message}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.dark,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  text: { flex: 1, color: colors.textOnDark, fontSize: 14, lineHeight: 19, fontWeight: '600' },
});
