import { getLocales } from 'expo-localization';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { CountryPickerModal } from '@/components/country-picker-modal';
import { Button, Card, Field, Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/constants/theme';
import { changeLocale } from '@/lib/actions';
import { COUNTRIES, CURRENCIES, formatMoney } from '@/lib/currency';
import {
  fetchSuggestedExchangeRate,
  formatExchangeRateInput,
  parseExchangeRateInput,
} from '@/lib/exchange-rate';
import { useStore } from '@/lib/store';

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
  const [pickerOpen, setPickerOpen] = useState(false);
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
      // Premier lancement : on va droit à la création du projet, sans écran
      // d'accueil intermédiaire — c'est le but recherché par l'utilisateur.
      else router.replace('/onboarding/mode');
    } finally {
      setSaving(false);
    }
  };

  const isHero = settings !== '1';

  return (
    <Screen contentContainerStyle={isHero ? styles.heroScrollContent : undefined}>
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

      <Card style={isHero ? styles.heroCard : undefined}>
        <Text style={styles.eyebrow}>{settings === '1' ? 'Réglages' : 'Bienvenue'}</Text>
        <Text style={styles.title}>Où épargnes-tu ?</Text>
        <Text style={styles.body}>
          MMG adapte automatiquement l'application à ta devise locale.
        </Text>

        {isHero ? <View style={styles.heroSpacer} /> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Changer le pays, actuellement ${selectedCountry.name}`}
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.selectionSummary, pressed && styles.selectionPressed]}>
          <Text style={styles.selectionValue}>
            {selectedCountry.flag} {selectedCountry.name} · {CURRENCIES[selectedCountry.currency].symbol}
          </Text>
          <Text style={styles.changeChevron}>⌄</Text>
        </Pressable>

        <CountryPickerModal
          visible={pickerOpen}
          selectedCode={selectedCode}
          onClose={() => setPickerOpen(false)}
          onConfirm={(code) => {
            setSelectedCode(code);
            setSaveError(null);
            setPickerOpen(false);
          }}
        />

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
          label="Continuer"
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
  title: { fontFamily: fonts.serifBold, color: colors.text, fontSize: 30, lineHeight: 36 },
  body: { fontFamily: fonts.sansRegular, color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 10 },
  // Écran d'accueil (hors réglages) : le pill et le bouton restent ancrés en
  // bas d'un grand espace respirant, comme dans la maquette. En réglages, la
  // carte garde sa hauteur naturelle, plus compacte.
  heroScrollContent: { flexGrow: 1 },
  heroCard: { flex: 1 },
  heroSpacer: { flex: 1, minHeight: 40 },
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
    backgroundColor: colors.card,
    borderRadius: radius.field,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  selectionPressed: { opacity: 0.8 },
  selectionValue: { flex: 1, fontFamily: fonts.sansSemiBold, color: colors.text, fontSize: 15 },
  changeChevron: { fontFamily: fonts.sansBold, color: colors.textSecondary, fontSize: 18 },
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
