import { getLocales } from 'expo-localization';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Button, Card, Field, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { changeLocale } from '@/lib/actions';
import { COUNTRIES, CURRENCIES, formatMoney } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';
import {
  fetchSuggestedExchangeRate,
  formatExchangeRateInput,
  parseExchangeRateInput,
} from '@/lib/exchange-rate';
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
  const budget = useStore((state) => state.budget);
  const goals = useStore((state) => state.goals);
  const hasFinancialData = useStore(
    (state) => Boolean(state.budget) || state.goals.length > 0
  );
  const [selectedCode, setSelectedCode] = useState(() => suggestedCountryCode(savedCountry));
  const [listOpen, setListOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conversionChoice, setConversionChoice] = useState<'convert' | 'keep'>('convert');
  const [rateText, setRateText] = useState('');
  const [rateSource, setRateSource] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedCountry = useMemo(
    () => COUNTRIES.find((country) => country.code === selectedCode) ?? COUNTRIES[0],
    [selectedCode]
  );
  const changingExistingCurrency =
    settings === '1' && hasFinancialData && selectedCountry.currency !== currentCurrency;
  const parsedRate = parseExchangeRateInput(rateText);
  const exampleAmount = budget?.income ?? goals[0]?.targetAmount ?? 100;

  useEffect(() => {
    if (!changingExistingCurrency) {
      setRateText('');
      setRateSource(null);
      setRateError(null);
      setRateLoading(false);
      return;
    }

    let active = true;
    setConversionChoice('convert');
    setRateText('');
    setRateSource(null);
    setRateError(null);
    setSaveError(null);
    setRateLoading(true);
    void fetchSuggestedExchangeRate(currentCurrency, selectedCountry.currency)
      .then((suggestion) => {
        if (!active) return;
        setRateText(formatExchangeRateInput(suggestion.rate));
        setRateSource(`${suggestion.source} · ${suggestion.date}`);
      })
      .catch(() => {
        if (!active) return;
        setRateError(
          'Taux automatique indisponible. Vérifie un taux récent, puis saisis-le manuellement.'
        );
      })
      .finally(() => {
        if (active) setRateLoading(false);
      });
    return () => {
      active = false;
    };
  }, [changingExistingCurrency, currentCurrency, selectedCountry.currency]);

  const save = async () => {
    if (saving) return;
    const conversionRate =
      changingExistingCurrency && conversionChoice === 'convert'
        ? (parsedRate ?? undefined)
        : undefined;
    if (changingExistingCurrency && conversionChoice === 'convert' && !conversionRate) {
      setSaveError('Entre un taux de conversion valide avant de continuer.');
      return;
    }
    setSaving(true);
    try {
      await changeLocale(selectedCountry.code, selectedCountry.currency, conversionRate);
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
        <Text style={styles.title}>Où épargnes-tu ?</Text>
        <Text style={styles.body}>
          MMG adapte les montants à ta devise. Le pays proposé vient du réglage régional de ton
          téléphone et tu peux le modifier.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Changer le pays, actuellement ${selectedCountry.name}`}
          accessibilityState={{ expanded: listOpen }}
          onPress={() => setListOpen((open) => !open)}
          style={({ pressed }) => [styles.selectionSummary, pressed && styles.countryRowPressed]}>
          <View style={styles.selectionCopy}>
            <Text style={styles.selectionLabel}>Pays et devise proposés</Text>
            <Text style={styles.selectionValue}>
              {selectedCountry.flag} {selectedCountry.name} · {CURRENCIES[selectedCountry.currency].name}
            </Text>
          </View>
          <Text style={styles.changeLabel}>{listOpen ? 'Fermer' : 'Changer'}</Text>
        </Pressable>

        {listOpen
          ? COUNTRY_GROUPS.map((group) => {
              const countries = COUNTRIES.filter(
                (country) => country.currency === group.currency
              );
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
                          onPress={() => {
                            setSelectedCode(country.code);
                            setListOpen(false);
                            setSaveError(null);
                          }}
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
            })
          : null}

        {changingExistingCurrency ? (
          <View style={styles.conversionCard}>
            <Text style={styles.conversionTitle}>Que faire de tes montants actuels ?</Text>
            <Text style={styles.conversionBody}>
              Le changement de devise ne sera appliqué qu'après ton choix et ta validation.
            </Text>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: conversionChoice === 'convert' }}
              onPress={() => {
                setConversionChoice('convert');
                setSaveError(null);
              }}
              style={[
                styles.conversionOption,
                conversionChoice === 'convert' && styles.conversionOptionSelected,
              ]}>
              <View
                style={[styles.radio, conversionChoice === 'convert' && styles.radioSelected]}>
                {conversionChoice === 'convert' ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.conversionOptionCopy}>
                <Text style={styles.conversionOptionTitle}>Convertir mes montants</Text>
                <Text style={styles.conversionOptionBody}>
                  Budget, projets, versements et soldes seront recalculés ensemble.
                </Text>
              </View>
            </Pressable>

            {conversionChoice === 'convert' ? (
              <View style={styles.rateBlock}>
                {rateLoading ? (
                  <Text style={styles.rateLoading}>Recherche du taux indicatif…</Text>
                ) : null}
                <Field
                  label={`Taux proposé ou vérifié · 1 ${currentCurrency} =`}
                  value={rateText}
                  onChangeText={(value) => {
                    setRateText(value.replace(/[^\d.,\s]/g, ''));
                    setRateSource('Taux saisi ou ajusté manuellement');
                    setRateError(null);
                    setSaveError(null);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="À renseigner"
                  suffix={selectedCountry.currency}
                  editable={!rateLoading}
                />
                {rateSource ? <Text style={styles.rateSource}>{rateSource}</Text> : null}
                {rateError ? <Text style={styles.rateError}>{rateError}</Text> : null}
                {parsedRate ? (
                  <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Aperçu avant validation</Text>
                    <Text style={styles.previewValue}>
                      {formatMoney(exampleAmount, currentCurrency)} →{' '}
                      {formatMoney(
                        exampleAmount * parsedRate,
                        selectedCountry.currency
                      )}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.rateDisclaimer}>
                  Le taux reste indicatif. Aucun montant personnel n'est envoyé pour le récupérer.
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: conversionChoice === 'keep' }}
              onPress={() => {
                setConversionChoice('keep');
                setSaveError(null);
              }}
              style={[
                styles.conversionOption,
                conversionChoice === 'keep' && styles.conversionOptionSelected,
              ]}>
              <View style={[styles.radio, conversionChoice === 'keep' && styles.radioSelected]}>
                {conversionChoice === 'keep' ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.conversionOptionCopy}>
                <Text style={styles.conversionOptionTitle}>Garder les mêmes valeurs</Text>
                <Text style={styles.conversionOptionBody}>
                  Seule l'unité change. Tu vérifieras ensuite les montants un par un.
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {saveError ? <Text style={styles.warning}>{saveError}</Text> : null}

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardSoft,
    borderRadius: radius.field,
    padding: 13,
    marginTop: 18,
  },
  selectionCopy: { flex: 1 },
  selectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  selectionValue: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 3 },
  changeLabel: { color: colors.accent, fontSize: 13, fontWeight: '800' },
  conversionCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    padding: 13,
    gap: 10,
  },
  conversionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  conversionBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  conversionOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    padding: 11,
  },
  conversionOptionSelected: { borderColor: colors.accent, backgroundColor: colors.cardSoft },
  conversionOptionCopy: { flex: 1 },
  conversionOptionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  conversionOptionBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  rateBlock: { gap: 8, paddingHorizontal: 2 },
  rateLoading: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  rateSource: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  rateError: { color: colors.accent, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  previewCard: { backgroundColor: colors.cardSoft, borderRadius: radius.field, padding: 11 },
  previewLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  previewValue: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 3 },
  rateDisclaimer: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  warning: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 12,
  },
  button: { marginTop: 18 },
});
