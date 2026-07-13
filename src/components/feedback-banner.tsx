import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, ReduceMotion } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';

export interface FeedbackMessage {
  key: string;
  title: string;
  detail: string;
}

export function FeedbackBanner({
  message,
  onFinished,
  duration = 2800,
}: {
  message: FeedbackMessage;
  onFinished: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onFinished, duration);
    return () => clearTimeout(timer);
  }, [duration, message.key, onFinished]);

  return (
    <Animated.View
      entering={FadeInDown.duration(240).reduceMotion(ReduceMotion.System)}
      exiting={FadeOutUp.duration(180).reduceMotion(ReduceMotion.System)}
      style={styles.banner}>
      <View style={styles.badge}>
        <Text style={styles.check}>✓</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.detail}>{message.detail}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.cardSoftBorder,
    borderRadius: radius.field,
    padding: 13,
    marginBottom: 12,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  check: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  copy: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
  detail: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },
});
