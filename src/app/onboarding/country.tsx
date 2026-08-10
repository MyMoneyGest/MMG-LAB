import { getLocales } from 'expo-localization';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Button, Card, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { changeLocale } from '@/lib/actions';
import { COUNTRIES, CURRENCIES } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';
import { useStore } from '@/lib/store';

const COUNTRY_GROUPS: { currency: CurrencyCode; label: string }[] = [
  { currency: 'XAF', label: 'Afrique centrale · FCFA' },
  { currency: 'XOF', label: "Afrique de l'Ouest · FCFA" },
  { currency: 'EUR', label: 'Zone euro' },
  { currency: 'USD', label: 'Dollar américain' },
];

function suggestedCountryCode(savedCountry?: string): string {
  if (savedCountry && COUNTRIES.some((country) => country.code === savedCountry)) {
    return savedCountry;
  }
  const region = getLocales()[0]?.regionCode?.toUpperCase();
  return COUNTRIES.some((country) => country.code === region) ? region! : 'FR';
}

export default function CountryScreen() {
  const router = useRouter();
  const { settings } = useLocalSearchParams<{ settings?: string }>();
  const savedCountry = useStore((state) => state.country);
  const currentCurrency = useStore((state) => state.currencyCode);
  const hasFinancialData = useStore(
    (state) => Boolean(state.budget) || state.goals.length > 0
  );
  const [selectedCode, setSelectedCode] = useState(() => suggestedCountryCode(savedCountry));
  const [saving, setSaving] = useState(false);
  const selectedCountry = useMemo(
    () => COUNTRIES.find((country) => country.code === selectedCode) ?? COUNTRIES[0],
    [selectedCode]
  );
  const changingExistingCurrency =
    settings === '1' && hasFinancialData && selectedCountry.currency !== currentCurrency;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await changeLocale(selectedCountry.code, selectedCountry.currency);
      if (settings === '1' && router.canGoBack()) router.back();
      else router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      {settings === '1' ? (
        <AppHeader showBack title="Pays et devise" showTestMark={false} />
      ) : (
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.brandName}>MMG</Text>
        </View>
      )}

      <Card>
        <Text style={styles.eyebrow}>{settings === '1' ? 'Réglages' : 'Bienvenue'}</Text>
        <Text style={styles.title}>Dans quel pays épargnes-tu ?</Text>
        <Text style={styles.body}>
          MMG adapte les montants à ta devise. Le pays proposé vient du réglage régional de ton
          téléphone et tu peux le modifier.
        </Text>

        {COUNTRY_GROUPS.map((group) => {
          const countries = COUNTRIES.filter((country) => country.currency === group.currency);
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
                      onPress={() => setSelectedCode(country.code)}
                      style={({ pressed }) => [
                        styles.countryRow,
                        selected && styles.countryRowSelected,
                        pressed && styles.countryRowPressed,
                      ]}>
                      <Text style={styles.flag}>{country.flag}</Text>
                      <View style={styles.countryCopy}>
                        <Text style={styles.countryName}>{country.name}</Text>
                        <Text style={styles.currencyName}>
                          {CURRENCIES[country.currency].symbol}
                        </Text>
                      </View>
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

        <View style={styles.selectionSummary}>
          <Text style={styles.selectionLabel}>Devise retenue</Text>
          <Text style={styles.selectionValue}>
            {selectedCountry.flag} {selectedCountry.name} · {CURRENCIES[selectedCountry.currency].name}
          </Text>
        </View>

        {changingExistingCurrency ? (
          <Text selectable style={styles.warning}>
            Important : MMG changera l'unité affichée, mais ne convertira pas les montants déjà
            enregistrés. Vérifie ensuite ton budget, tes objectifs et ton solde réel.
          </Text>
        ) : null}

        <Button
          label={settings === '1' ? 'Enregistrer' : 'Continuer'}
          onPress={() => void save()}
          loading={saving}
          loadingLabel="Mise à jour…"
          style={styles.button}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  brandName: { color: colors.text, fontSize: 19, fontWeight: '800' },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: colors.text, fontSize: 25, lineHeight: 31, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  group: { gap: 7, marginTop: 18 },
  groupLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  countryList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    overflow: 'hidden',
  },
  countryRow: {
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
  countryRowSelected: { backgroundColor: colors.cardSoft },
  countryRowPressed: { opacity: 0.72 },
  flag: { fontSize: 23 },
  countryCopy: { flex: 1 },
  countryName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  currencyName: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
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
  selectionSummary: {
    backgroundColor: colors.cardSoft,
    borderRadius: radius.field,
    padding: 13,
    marginTop: 18,
  },
  selectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  selectionValue: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 3 },
  warning: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 12,
  },
  button: { marginTop: 18 },
});
