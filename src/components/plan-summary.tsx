import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { Diagnostic } from '@/lib/plan';

// Récap de plan sur fond sombre : la couleur contrastée est réservée à ce
// moment précis (cf. direction visuelle).

export function PlanSummaryDark({
  description,
  monthly,
  targetDate,
  months,
  remaining,
  diagnostic,
  reminderDay,
  rhythm,
}: {
  description: string;
  monthly: string;
  targetDate: string;
  months: string;
  remaining: string;
  diagnostic: Diagnostic | null;
  reminderDay: number;
  rhythm?: string;
}) {
  const rows: { label: string; value: string; valueColor?: string }[] = [
    { label: 'À mettre de côté', value: monthly },
    { label: 'Date cible', value: targetDate },
    { label: 'Durée estimée', value: months },
    { label: 'Reste à financer', value: remaining },
  ];
  if (rhythm) rows.push({ label: 'Rythme', value: rhythm });
  if (diagnostic) {
    rows.push({
      label: 'Diagnostic',
      value: diagnostic,
      valueColor: diagnostic === 'Confortable' ? '#7ED6A2' : diagnostic === 'Juste' ? '#E8C36A' : '#F08A72',
    });
  }
  rows.push({ label: 'Rappel', value: `Le ${reminderDay} du mois` });

  return (
    <View style={styles.card}>
      <Text style={styles.description}>{description}</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={[styles.value, row.valueColor ? { color: row.valueColor } : null]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark,
    borderRadius: radius.card,
    padding: 24,
    marginBottom: 16,
  },
  description: { fontSize: 17, color: colors.textOnDark, marginBottom: 6, lineHeight: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(247, 242, 234, 0.25)',
  },
  label: { fontSize: 16, color: colors.textOnDarkMuted },
  value: { fontSize: 18, fontWeight: '800', color: colors.textOnDark },
});
