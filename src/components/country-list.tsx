import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import { COUNTRIES, CURRENCIES } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';

// Liste de pays cherchable et groupée par devise, partagée par le bottom
// sheet (premier lancement) et l'écran de réglages, qui l'affiche à plat.
// Choisir une ligne vaut confirmation : pas d'état intermédiaire.

const COUNTRY_GROUPS: { currency: CurrencyCode; label: string }[] = [
  { currency: 'XAF', label: 'Afrique centrale · FCFA' },
  { currency: 'XOF', label: "Afrique de l'Ouest · FCFA" },
  { currency: 'EUR', label: 'Zone euro' },
  { currency: 'USD', label: 'Dollar américain' },
];

export function CountryList({
  selectedCode,
  onSelect,
  resetKey,
  embedded = false,
}: {
  selectedCode: string;
  onSelect: (code: string) => void;
  /** Change pour vider la recherche (ex. réouverture du bottom sheet). */
  resetKey?: unknown;
  /** Rend la liste sans conteneur défilant propre : l'écran hôte défile
   * d'un seul bloc, ce qui permet de l'amener sur une section située sous
   * la liste (deux ScrollView imbriqués l'en empêcheraient). */
  embedded?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [lastReset, setLastReset] = useState(resetKey);
  if (resetKey !== lastReset) {
    setLastReset(resetKey);
    setQuery('');
  }
  const normalizedQuery = query.trim().toLowerCase();

  const rows = (
    <>
      {COUNTRY_GROUPS.map((group) => {
        const countries = COUNTRIES.filter(
          (country) =>
            country.currency === group.currency &&
            (!normalizedQuery || country.name.toLowerCase().includes(normalizedQuery))
        );
        if (!countries.length) return null;
        return (
          <View key={group.currency} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.countryList}>
              {countries.map((country) => {
                const selected = country.code === selectedCode;
                return (
                  <Pressable
                    key={country.code}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${country.name}, ${CURRENCIES[country.currency].name}`}
                    onPress={() => onSelect(country.code)}
                    style={({ pressed }) => [
                      styles.row,
                      selected && styles.rowSelected,
                      pressed && styles.rowPressed,
                    ]}>
                    <Text style={styles.flag}>{country.flag}</Text>
                    <Text style={styles.countryName}>{country.name}</Text>
                    <Text style={styles.currencyName}>{CURRENCIES[country.currency].symbol}</Text>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
      {normalizedQuery && !COUNTRIES.some((c) => c.name.toLowerCase().includes(normalizedQuery)) ? (
        <Text style={styles.empty}>Aucun pays ne correspond à « {query} ».</Text>
      ) : null}
    </>
  );

  return (
    <>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher un pays…"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />
      {embedded ? (
        <View style={styles.scrollContent}>{rows}</View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {rows}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  scrollContent: { paddingBottom: 8 },
  group: { gap: 7, marginBottom: 16 },
  groupLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  countryList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowSelected: { backgroundColor: colors.cardSoft },
  rowPressed: { opacity: 0.72 },
  flag: { fontSize: 22 },
  countryName: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.text },
  currencyName: { fontFamily: fonts.sansRegular, fontSize: 12, color: colors.textSecondary },
  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.accent },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent },
  empty: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
