import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';

export function ActionLoadingOverlay({
  visible,
  title,
  detail,
  delay = 40,
}: {
  visible: boolean;
  title: string;
  detail?: string;
  delay?: number;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [delay, visible]);

  return (
    <Modal
      visible={shown}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <Animated.View
          accessibilityRole="progressbar"
          accessibilityLabel={title}
          entering={FadeInUp.duration(320).reduceMotion(ReduceMotion.System)}
          style={styles.card}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.title}>{title}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(30, 22, 16, 0.38)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  detail: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    textAlign: 'center',
  },
});
