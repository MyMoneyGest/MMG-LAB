import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/constants/theme';
import { COUNTRIES, CURRENCIES } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';
import { Button } from './ui';

// Sélecteur de pays en vrai bottom sheet (recherche + liste groupée par
// devise + récapitulatif fixe en bas). Sépare le choix du pays de l'écran
// principal, pour que son bouton "Continuer" ne soit plus jamais poussé
// par une liste qui s'étend en accordéon.

const COUNTRY_GROUPS: { currency: CurrencyCode; label: string }[] = [
  { currency: 'XAF', label: 'Afrique centrale · FCFA' },
  { currency: 'XOF', label: "Afrique de l'Ouest · FCFA" },
  { currency: 'EUR', label: 'Zone euro' },
  { currency: 'USD', label: 'Dollar américain' },
];

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
  const [pendingCode, setPendingCode] = useState(selectedCode);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    setPendingCode(selectedCode);
    setQuery('');
  }, [visible, selectedCode]);

  const pendingCountry = COUNTRIES.find((c) => c.code === pendingCode) ?? COUNTRIES[0];
  const normalizedQuery = query.trim().toLowerCase();

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

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un pays…"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
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
                      const selected = country.code === pendingCode;
                      return (
                        <Pressable
                          key={country.code}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={`${country.name}, ${CURRENCIES[country.currency].name}`}
                          onPress={() => setPendingCode(country.code)}
                          style={({ pressed }) => [
                            styles.row,
                            selected && styles.rowSelected,
                            pressed && styles.rowPressed,
                          ]}>
                          <Text style={styles.flag}>{country.flag}</Text>
                          <Text style={styles.countryName}>{country.name}</Text>
                          <Text style={styles.currencyName}>
                            {CURRENCIES[country.currency].symbol}
                          </Text>
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
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerSummary}>
              <Text style={styles.footerFlag}>{pendingCountry.flag}</Text>
              <Text numberOfLines={1} style={styles.footerText}>
                {pendingCountry.name} · {CURRENCIES[pendingCountry.currency].symbol}
              </Text>
            </View>
            <Button label="Confirmer" onPress={() => onConfirm(pendingCode)} style={styles.confirmButton} />
          </View>
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  footerSummary: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerFlag: { fontSize: 20 },
  footerText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text, flexShrink: 1 },
  confirmButton: { flex: 0, minWidth: 130 },
});
