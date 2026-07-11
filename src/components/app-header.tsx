import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { MenuModal } from './menu-modal';

export function AppHeader({ showBack, currentGoalId }: { showBack?: boolean; currentGoalId?: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.logo}>
        <Text style={styles.logoLetter}>M</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>MMG</Text>
        <Text style={styles.subtitle}>MyMoneyGest</Text>
      </View>
      {showBack ? (
        <Pressable
          style={styles.iconButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}>
          <Text style={styles.iconLabel}>‹</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.iconButton} onPress={() => setMenuOpen(true)}>
        <Text style={[styles.iconLabel, { letterSpacing: 1, fontSize: 20 }]}>⋯</Text>
      </Pressable>
      <MenuModal visible={menuOpen} onClose={() => setMenuOpen(false)} currentGoalId={currentGoalId} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: -2 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: -2 },
});
