import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import { COUNTRIES_ALPHABETICAL, CURRENCIES, foldAccents } from '@/lib/currency';

// Liste de pays cherchable, partagée par le bottom sheet (premier lancement)
// et l'écran de réglages. Choisir une ligne vaut confirmation : pas d'état
// intermédiaire.
//
// Ordre alphabétique plutôt que regroupé par zone monétaire : sur seize pays
// les en-têtes de groupe coûtaient quatre lignes de chrome et obligeaient à
// savoir dans quelle zone on se trouve pour retrouver le sien. La devise reste
// lisible sur chaque ligne.

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
  const normalizedQuery = foldAccents(query.trim());
  const countries = normalizedQuery
    ? COUNTRIES_ALPHABETICAL.filter((country) =>
        foldAccents(country.name).includes(normalizedQuery)
      )
    : COUNTRIES_ALPHABETICAL;

  const rows = countries.length ? (
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
  ) : (
    <Text style={styles.empty}>Aucun pays ne correspond à « {query} ».</Text>
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
    backgroundColor: colors.field,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  scrollContent: { paddingBottom: 8 },
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
