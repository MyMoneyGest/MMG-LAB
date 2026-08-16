import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const readBinary = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
const pngSize = (path) => {
  const image = readBinary(path);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return [image.readUInt32BE(16), image.readUInt32BE(20)];
};

const appConfig = JSON.parse(read('app.json'));
const ui = read('src/components/ui.tsx');
const header = read('src/components/app-header.tsx');
const index = read('src/app/index.tsx');
const budget = read('src/app/onboarding/budget.tsx');
const country = read('src/app/onboarding/country.tsx');
const countryPicker = read('src/components/country-picker-modal.tsx');
const newGoal = read('src/app/onboarding/new-goal.tsx');
const adjustGoal = read('src/app/adjust-goal.tsx');
const goal = read('src/app/goal/[id].tsx');
const menu = read('src/components/menu-modal.tsx');
const report = read('src/components/report-modal.tsx');
const reminderDay = read('src/components/reminder-day-modal.tsx');
const balance = read('src/components/balance-modal.tsx');
const rebalance = read('src/components/rebalance-modal.tsx');
const confirmation = read('src/components/confirmation-overlay.tsx');
const loadingOverlay = read('src/components/action-loading-overlay.tsx');
const feedbackBanner = read('src/components/feedback-banner.tsx');
const appDialog = read('src/components/app-dialog.tsx');
const timing = read('src/lib/timing.ts');
const theme = read('src/constants/theme.ts');
const planSummary = read('src/components/plan-summary.tsx');
const iconGenerator = read('scripts/generate-app-icons.swift');
const actions = read('src/lib/actions.ts');
const goalTypes = read('src/lib/types.ts');
const savingsLocationModal = read('src/components/savings-location-modal.tsx');

assert.match(newGoal, /La date cible doit permettre le premier rappel prévu/);

assert.equal(appConfig.expo.icon, './assets/images/icon.png');
assert.equal(appConfig.expo.ios.icon, './assets/images/icon.png');
assert.equal(
  appConfig.expo.android.adaptiveIcon.foregroundImage,
  './assets/images/android-icon-foreground.png'
);
assert.equal(
  appConfig.expo.android.adaptiveIcon.monochromeImage,
  './assets/images/android-icon-monochrome.png'
);
assert.equal(appConfig.expo.android.adaptiveIcon.backgroundColor, '#B5432A');
assert.equal(appConfig.expo.android.adaptiveIcon.backgroundImage, undefined);
assert.ok(appConfig.expo.plugins.includes('expo-localization'));
assert.deepEqual(pngSize('assets/images/icon.png'), [1024, 1024]);
assert.deepEqual(pngSize('assets/images/android-icon-foreground.png'), [1024, 1024]);
assert.deepEqual(pngSize('assets/images/android-icon-monochrome.png'), [1024, 1024]);
assert.deepEqual(pngSize('assets/images/splash-icon.png'), [512, 512]);
assert.deepEqual(pngSize('assets/images/favicon.png'), [512, 512]);
assert.match(iconGenerator, /let brand = NSColor\(hex: "#B5432A"\)/);
assert.match(iconGenerator, /let monogram = "M"/);

// Écran d'accueil retiré (home.tsx supprimé) et écran de choix du mode retiré
// (mode.tsx supprimé) : premier lancement et retour sans projet vont
// désormais droit à la création (/onboarding/new-goal), sans étape
// intermédiaire ; le mode guidé/libre se choisit via un bascule sur cet
// écran. La bannière « Projet supprimé » vit maintenant sur cet écran.
assert.match(index, /return <Redirect href="\/onboarding\/new-goal" \/>/);
// Le retour d'un écran sans historique (replace) accepte une destination de
// repli configurable : par défaut '/', mais new-goal.tsx pointe vers l'écran
// pays quand aucun projet n'existe encore (sinon le retour rebouclerait sur
// lui-même, index.tsx redirigeant tout projet manquant vers new-goal).
assert.match(header, /fallbackHref = '\/'/);
assert.match(header, /router\.replace\(fallbackHref\)/);
// Sans projet, le repli vise l'écran pays en mode accueil (logo + Bienvenue,
// sans flèche retour) et non sa variante réglages : c'est lui qui fait office
// d'écran d'entrée depuis le retrait de home.tsx.
assert.match(newGoal, /fallbackHref=\{goals\.length === 0 \? '\/onboarding\/country' : '\/'\}/);
assert.match(newGoal, /<FeedbackBanner/);
// Store Zustand dédié (pas de query params ni de simple useEffect au montage) :
// sur web, expo-router garde l'écran cible déjà instancié d'une visite à
// l'autre — seule une notification réactive traverse cette navigation de
// façon fiable, indépendamment du cycle de montage/focus.
assert.match(newGoal, /usePendingFeedbackStore\(\(s\) => s\.message\)/);
assert.match(newGoal, /usePendingFeedbackStore\.getState\(\)\.take\(\)/);
const pendingFeedback = read('src/lib/pending-feedback.ts');
assert.match(pendingFeedback, /export const usePendingFeedbackStore = create</);
assert.match(pendingFeedback, /export function setPendingFeedback/);
// Écran 5 : la suppression vit exclusivement sur l'écran « Ajuster le
// projet/plan », plus dans le menu (sécurité contre un tap accidentel).
assert.match(adjustGoal, /setPendingFeedback\(\{/);
assert.match(adjustGoal, /Projet supprimé/);
assert.doesNotMatch(menu, /setPendingFeedback/);
assert.doesNotMatch(menu, /Supprimer/);
assert.doesNotMatch(menu, /<AppDialog/);

assert.match(index, /if \(!country\) return <Redirect href="\/onboarding\/country"/);
assert.match(country, /getLocales\(\)\[0\]\?\.regionCode/);
assert.match(country, /useState\(false\)/);
// Le choix du pays est un vrai bottom sheet (CountryPickerModal), plus un accordéon
// inline : le bouton "Continuer" n'est donc plus jamais poussé par une liste ouverte.
assert.match(country, /<CountryPickerModal/);
assert.match(country, /visible=\{pickerOpen\}/);
assert.match(country, /setPickerOpen\(false\)/);
assert.match(country, /fontFamily: fonts\.serifBold/);
assert.match(country, /accessibilityRole="radio"/);
assert.match(country, /Où épargnes-tu/);
// Le prénom facultatif se saisit ici, à côté de « Bienvenue » : c'est une
// info sur la personne, pas sur un projet (retirée de l'écran de création).
assert.match(country, /styles\.eyebrowRow/);
assert.match(country, /setUserName\(nameDraft\)/);
assert.match(country, /userName \?\? 'Ton prénom'/);
assert.doesNotMatch(newGoal, /Comment doit-on t'appeler|setUserName/);
// Liste partagée (recherche + groupes par devise + radio) entre le bottom
// sheet du premier lancement et l'écran de réglages, qui l'affiche à plat :
// on y vient pour changer de pays, pas pour relire la page d'accueil.
const countryList = read('src/components/country-list.tsx');
assert.match(countryList, /Rechercher un pays…/);
assert.match(countryList, /accessibilityRole="radio"/);
assert.match(countryList, /accessibilityState=\{\{ checked: selected \}\}/);
// Choisir une ligne vaut confirmation : plus d'état intermédiaire ni de
// bouton « Confirmer » (un tap de moins pour changer de pays).
assert.match(countryList, /onPress=\{\(\) => onSelect\(country\.code\)\}/);
assert.doesNotMatch(countryPicker, /label="Confirmer"|pendingCode/);
assert.match(countryPicker, /<CountryList selectedCode=\{selectedCode\} onSelect=\{onConfirm\}/);
assert.match(country, /<CountryList\s+embedded\s+selectedCode=\{selectedCode\}/);
assert.match(country, /const selectInSettings = async/);
// La liste s'intègre au défilement de l'écran (pas de ScrollView imbriqué),
// pour pouvoir amener l'utilisateur sur le bloc à confirmer qui la suit.
assert.match(countryList, /embedded \? \(\s*<View style=\{styles\.scrollContent\}>/);
// Le défilement part de l'onLayout du bloc : au moment du tap il n'est pas
// encore monté, sa position n'est donc pas connue.
assert.match(country, /scrollToConversion\.current = true;/);
assert.match(country, /settingsScrollRef\.current\?\.scrollTo\(\{ y, animated: true \}\)/);
assert.match(ui, /scrollRef\?: MutableRefObject<ScrollView \| null>/);
// Application immédiate, sauf si une décision de conversion est requise.
assert.match(country, /if \(hasFinancialData && country\.currency !== currentCurrency\) \{/);
assert.match(country, /Que faire de tes montants actuels/);
assert.match(country, /Convertir mes montants/);
assert.match(country, /Garder les mêmes valeurs/);
assert.match(country, /fetchSuggestedExchangeRate\(currentCurrency, selectedCountry\.currency\)/);
assert.match(country, /Aucun montant personnel n'est envoyé/);
assert.match(country, /await changeLocale\(selectedCountry\.code, selectedCountry\.currency, conversionRate\)/);
assert.match(menu, /Pays et devise/);
assert.match(menu, /pathname: '\/onboarding\/country'/);
assert.match(actions, /state\.setLocale\(\{ country, currencyCode \}\)/);
assert.match(actions, /state\.convertLocale\(\{ country, currencyCode, rate: conversionRate \}\)/);
assert.match(actions, /scheduleGoalReminders\(goal, suggestedAmount\(goal\)\)/);

// Le choix guidé/libre n'est plus un écran séparé : un bascule inline sur
// l'écran 2 (jour de rappel) remplace l'ancien /onboarding/mode.
assert.match(newGoal, /Épargne libre/);
assert.match(newGoal, /<Switch/);
assert.match(newGoal, /setSavingsMode\(value \? 'free' : 'guided'\)/);
assert.match(newGoal, /Aucun budget ni montant mensuel ne sera imposé/);

assert.match(ui, /footer\?: ReactNode/);
assert.match(ui, /styles\.screenFooter/);
assert.match(ui, /export function StepIndicator/);
assert.match(ui, /ActivityIndicator/);
assert.match(ui, /loadingLabel\?: string/);
assert.match(ui, /styles\.buttonLoadingContent/);
assert.match(ui, /withTiming/);
assert.match(ui, /interpolateColor/);
assert.match(ui, /PROGRESS_COLOR_STOPS = \[0, 35, 70, 100\]/);
assert.match(ui, /colors\.progress\.start/);
assert.match(ui, /colors\.progress\.steady/);
assert.match(ui, /colors\.progress\.advanced/);
assert.match(ui, /colors\.progress\.complete/);
assert.match(ui, /backgroundColor: interpolateColor\(progress\.value/);
assert.match(ui, /color: interpolateColor\(progress\.value/);
assert.match(ui, /borderBottomColor: interpolateColor\(/);
assert.match(ui, /<Animated\.Text/);
assert.match(ui, /fontVariant: \['tabular-nums'\]/);
assert.match(ui, /duration: target >= 100 \? 1_400 : 650/);
assert.match(ui, /ReduceMotion\.System/);
assert.match(ui, /numberOfLines=\{1\}/);
assert.match(ui, /adjustsFontSizeToFit/);
assert.match(ui, /minimumFontScale=\{0\.82\}/);
assert.match(ui, /minHeight: 44/);
assert.match(ui, /paddingVertical: 12/);
assert.match(ui, /label\?: string/);
assert.match(ui, /target <= 14/);
assert.match(ui, /target >= 86/);
assert.match(ui, /styles\.progressMarkerArrow/);
assert.match(theme, /card: 22/);
assert.match(theme, /button: 18/);
assert.match(theme, /screen: 16/);
assert.match(theme, /card: 18/);
assert.match(theme, /start: '#8A6554'/);
assert.match(theme, /steady: '#B5432A'/);
assert.match(theme, /advanced: '#96641F'/);
assert.match(theme, /complete: '#3F7D59'/);
assert.match(planSummary, /padding: 18/);

assert.match(header, /delayLongPress=\{700\}/);
assert.match(header, /title\?: string/);
assert.match(header, /width: 40/);
assert.match(header, /<AppDialog/);
assert.doesNotMatch(header, /Alert\.alert|\bAlert\b/);

assert.doesNotMatch(budget, /<StepIndicator/);
assert.doesNotMatch(budget, /Étape 1 sur 3/);
assert.match(budget, /marge de sécurité de 20/);

assert.match(ui, /labels = \['Projet', 'Rythme'\]/);
assert.match(ui, /Étape \$\{current\} sur \$\{total\}/);
assert.match(newGoal, /useState<1 \| 2>\(1\)/);
assert.match(newGoal, /subtitle=\{`Étape \$\{step\} sur 2`\}/);
assert.match(
  newGoal,
  /labels=\{savingsMode === 'free' \? \['Projet', 'Rappel'\] : \['Projet', 'Rythme'\]\}/
);
assert.doesNotMatch(newGoal, /sur 3/);
assert.match(newGoal, /\['emergency', 'car', 'moving', 'travel', 'housing', 'other'\]/);
assert.match(newGoal, /CATEGORY_LABELS\[c\]/);
assert.match(newGoal, /category === 'other' \? 'Choisis un nom pour ton projet'/);
assert.doesNotMatch(newGoal, /editId|Ajuster le plan/);
assert.match(newGoal, /Continuer vers le rythme/);
// Erreurs de saisie en pop-up flottante auto-effaçable (via Modal : le
// contenu des écrans vit dans un ScrollView, où `absolute` suivrait le
// défilement), plus en texte inline sous les champs.
const errorToast = read('src/components/error-toast.tsx');
assert.match(errorToast, /<Modal visible transparent/);
assert.match(errorToast, /setTimeout\(onFinished, duration\)/);
assert.match(errorToast, /accessibilityRole="alert"/);
assert.match(newGoal, /<ErrorToast key=\{error\.key\}/);
assert.doesNotMatch(newGoal, /styles\.error\b/);
// Retour depuis l'étape 2 : revient à l'étape 1 au lieu de quitter l'écran.
assert.match(newGoal, /onBack=\{step === 2 \? \(\) => setStep\(1\) : undefined\}/);
assert.match(header, /onBack\?: \(\) => void/);
// Choisir un type dans la liste écrase le nom déjà saisi.
assert.doesNotMatch(newGoal, /!name\.trim\(\) \|\| nameIsSuggested/);
// Jour de rappel ordinal (« le 1er », pas « le 1 »).
assert.match(newGoal, /Rappel le <Text style=\{styles\.dayHintAccent\}>\{formatReminderDay\(reminderDay\)\}/);
assert.match(newGoal, /Continuer vers le rappel/);
assert.match(newGoal, /savingsMode === 'free'/);
assert.match(newGoal, /savingsMode,/);
assert.match(newGoal, /Aucun budget ni montant mensuel ne sera imposé/);
assert.match(newGoal, /Quand veux-tu commencer/);
assert.match(newGoal, /Dès maintenant/);
assert.match(newGoal, /Plus tard/);
assert.match(newGoal, /Date de démarrage/);
assert.match(newGoal, /Aucun rappel ne partira avant cette date/);
assert.match(newGoal, /startDate: startMode === 'later' \? parsedStartDate! : undefined/);
assert.match(newGoal, /loading=\{saving\}/);
assert.match(newGoal, /loadingLabel="Création…"/);
assert.match(newGoal, /<ActionLoadingOverlay/);
assert.match(newGoal, /feedback: 'created'/);
assert.match(newGoal, /waitForMinimumLoading\(loadingStartedAt\)/);
assert.match(newGoal, /rhythmCardSelected: \{ backgroundColor: colors\.cardSoft/);
assert.match(newGoal, /Ton budget mensuel/);
assert.match(newGoal, />Revenus</);
assert.match(newGoal, />Charges fixes</);
assert.match(newGoal, />Dépenses</);
assert.match(newGoal, /Projets en cours \(\{activeExistingGoals\.length\}\)/);
assert.match(newGoal, />Reste réellement disponible</);
assert.match(
  newGoal,
  /budget\.income - budget\.fixedCharges - budget\.variableExpenses - existingEffort/
);
assert.match(newGoal, /prudentCapacity\(budget\) - existingEffort/);
assert.match(newGoal, /Capacité prudente encore disponible :/);
assert.match(newGoal, /remainingAfterExistingGoals < 0/);
assert.match(newGoal, /accessibilityLabel="Ajuster le budget"/);
assert.match(newGoal, /params: \{ returnToGoal: '1' \}/);
assert.match(budget, /returnToGoal === '1'/);
assert.match(budget, /standalone === '1'/);
assert.doesNotMatch(budget, /goalSavingsMode/);

assert.match(adjustGoal, /Les paramètres utiles, en un seul écran/);
assert.match(adjustGoal, /Le nom et le type de projet restent inchangés/);
assert.match(adjustGoal, /label="Nouveau montant cible"/);
assert.match(adjustGoal, /label="Nouvelle date cible"/);
assert.match(adjustGoal, /label="Jour de rappel \(1 à 28\)"/);
assert.match(adjustGoal, /Rythme des versements/);
assert.match(adjustGoal, /Avant → après/);
assert.match(adjustGoal, /label: 'Versement conseillé'/);
assert.match(adjustGoal, /label: 'Mois le plus élevé'/);
assert.match(adjustGoal, /targetAmount: parsedTarget!/);
assert.match(adjustGoal, /changeReminderDay\(updated, reminderDay\)/);
assert.match(adjustGoal, /loadingLabel="Mise à jour…"/);
assert.match(adjustGoal, /<ActionLoadingOverlay/);
assert.match(adjustGoal, /feedback: 'adjusted'/);
assert.match(adjustGoal, /waitForMinimumLoading\(loadingStartedAt\)/);
assert.doesNotMatch(adjustGoal, /<StepIndicator|Quel projet veux-tu préparer/);

assert.match(goal, /<Screen footer=\{tabBar\}>/);
assert.match(goal, /schedule\.slice\(0, 2\)/);
assert.match(goal, /label=\{`J'ai mis de côté ✓ \(\$\{money\(suggested\)\}\)`\}/);
assert.match(goal, /label="J'ai mis de côté ✓"/);
assert.match(goal, /titleSerif/);
assert.match(header, /titleSerif/);
assert.match(header, /fonts\.serifBold/);
assert.match(goal, /Aucun montant imposé/);
assert.match(goal, /goalStartsInFuture\(goal\)/);
assert.match(goal, /Tout est prêt pour le/);
assert.match(goal, /Aucune action n’est attendue avant le démarrage/);
assert.match(goal, /freeMode \? 'Montant libre'/);
assert.match(goal, /loading=\{actionLoading\}/);
assert.match(goal, /loadingLabel="Enregistrement…"/);
assert.match(goal, /<ActionLoadingOverlay/);
assert.match(goal, /<FeedbackBanner/);
assert.match(goal, /Rappel reporté/);
assert.match(goal, /Jour de rappel modifié/);
assert.match(goal, /MIN_INLINE_LOADING_MS/);
assert.match(goal, /waitForMinimumLoading\(loadingStartedAt\)/);
assert.match(goal, /accessibilityRole="tab"/);
assert.match(goal, /tabActive: \{ backgroundColor: colors\.accent/);
assert.match(goal, /<ProgressRing pct=\{pct\} amount=\{money\(saved\)\}/);
assert.match(goal, /styles\.progressFooter/);
assert.match(goal, /Cible \{formatDate\(goal\.targetDate\)\}/);
assert.match(goal, />Où \?</);
assert.match(goal, /goal\.savingsLocation \?\? 'Ajouter'/);
assert.match(goal, /<SavingsLocationModal/);
assert.match(goal, /hitSlop=\{5\}/);
assert.match(goalTypes, /savingsLocation\?: string/);
assert.match(savingsLocationModal, /Où gardes-tu cette épargne/);
assert.match(savingsLocationModal, /Compte ou support/);
assert.match(savingsLocationModal, /uniquement\s+sur ton téléphone/);
assert.doesNotMatch(newGoal, /SavingsLocationModal|savingsLocation/);
assert.doesNotMatch(actions, /savingsLocation/);
assert.match(goal, /<Switch/);
assert.match(goal, /Coup de pouce à mi-parcours/);
assert.match(goal, /Un message entre deux rappels, sans action demandée/);
assert.match(goal, /Boolean\(goal\.midCycleNudgeEnabled\)/);
assert.match(goal, /changeMidCycleNudge\(currentGoal, enabled\)/);
// Outils de test (M + aperçu du coup de pouce) gardés par le même drapeau, absents en distribution.
assert.match(header, /TEST_TOOLS_ENABLED \?/);
assert.doesNotMatch(header, /__DEV__/);
assert.match(goal, /TEST_TOOLS_ENABLED && goal\.midCycleNudgeEnabled && notificationsSupported/);
assert.match(
  read('src/lib/test-tools.ts'),
  /EXPO_PUBLIC_MMG_TEST_TOOLS === '1'/,
);
assert.match(goalTypes, /midCycleNudgeEnabled\?: boolean/);
assert.doesNotMatch(newGoal, /midCycleNudgeEnabled|Coup de pouce à mi-parcours/);
assert.doesNotMatch(goal, /Solde global (?:pas encore )?confirmé/);
assert.match(goal, /Jour de rappel : le \{formatReminderDay\(goal\.reminderDay\)\} · Modifier/);
assert.match(planSummary, /Le \$\{formatReminderDay\(reminderDay\)\} du mois/);
assert.match(adjustGoal, /Le \$\{formatReminderDay\(goal\.reminderDay\)\}/);
assert.match(goal, /accessibilityLabel="Expliquer le solde réel"/);
assert.match(goal, /À quoi sert le solde réel/);
assert.match(goal, /Rien n’est connecté à ta banque/);
assert.match(goal, /visible=\{balanceInfoOpen\}/);
assert.match(goal, /feedback\?: 'created' \| 'adjusted' \| 'deleted'/);
assert.doesNotMatch(goal, /Alert\.alert|\bAlert\b/);

assert.match(menu, /justifyContent: 'flex-end'/);
assert.match(menu, /styles\.grabber/);
assert.doesNotMatch(menu, /label="Accueil"/);
assert.doesNotMatch(menu, /variant="dark"/);
assert.match(menu, /const orderedGoals = activeGoal/);
assert.match(menu, /\[activeGoal, \.\.\.goals\.filter/);
assert.match(menu, /useSafeAreaInsets/);
assert.match(menu, /Math\.max\(insets\.bottom \+ 8, 20\)/);
assert.match(menu, /params: \{ standalone: '1' \}/);
assert.match(menu, /router\.push\('\/onboarding\/new-goal'\)/);
assert.match(menu, /pathname: '\/adjust-goal'/);
assert.match(menu, /params: \{ id: currentGoalId \}/);
assert.match(menu, /contentInsetAdjustmentBehavior="automatic"/);
assert.match(menu, /styles\.actionList/);
assert.match(menu, /minimumFontScale=\{0\.85\}/);
assert.match(menu, /style=\{styles\.actionChevron\}>›/);
assert.doesNotMatch(menu, /styles\.actionRow/);
assert.doesNotMatch(menu, /Alert\.alert|\bAlert\b/);

assert.match(adjustGoal, /<AppDialog/);
assert.match(adjustGoal, /loadingLabel="Suppression…"/);
assert.match(adjustGoal, /await waitForMinimumLoading\(loadingStartedAt\)/);
assert.match(adjustGoal, /feedback: 'deleted'/);
assert.match(adjustGoal, /removeGoal\(goal\)/);
assert.match(adjustGoal, /Zone sensible/);
assert.match(adjustGoal, /label="Supprimer ce projet"/);

assert.match(appDialog, /export type AppDialogTone = 'info' \| 'success' \| 'danger'/);
assert.match(appDialog, /accessibilityViewIsModal/);
assert.match(appDialog, /FadeInUp\.duration\(360\)/);
assert.match(appDialog, /ReduceMotion\.System/);
assert.match(appDialog, /<Text selectable style=\{styles\.message\}>/);
assert.match(appDialog, /cancelLabel/);
assert.match(appDialog, /loadingLabel/);

assert.match(report, /loading=\{saving\}/);
assert.match(report, /loadingLabel="Programmation…"/);
assert.match(report, /label="Valider la date"/);
assert.match(report, /style=\{\{ flex: 1\.2 \}\}/);
assert.match(confirmation, /ZoomIn/);
assert.match(confirmation, /FadeInUp\.delay/);
assert.match(confirmation, /Objectif atteint/);
assert.match(confirmation, /ReduceMotion\.System/);
assert.match(confirmation, /delay\(760\)\.duration\(300\)/);
assert.match(reminderDay, /loadingLabel="Mise à jour…"/);
assert.match(balance, /loadingLabel="Recalcul…"/);
assert.match(rebalance, /loadingLabel="Application…"/);
assert.match(loadingOverlay, /setTimeout\(\(\) => setShown\(true\), delay\)/);
assert.match(loadingOverlay, /delay = 40/);
assert.match(loadingOverlay, /FadeInUp\.duration\(320\)/);
assert.match(loadingOverlay, /FadeInUp/);
assert.match(loadingOverlay, /ReduceMotion\.System/);
assert.match(feedbackBanner, /FadeInDown/);
assert.match(feedbackBanner, /FadeOutUp/);
assert.match(feedbackBanner, /setTimeout\(onFinished, duration\)/);
assert.match(feedbackBanner, /duration = 4200/);
assert.match(feedbackBanner, /FadeInDown\.duration\(360\)/);
assert.match(feedbackBanner, /ReduceMotion\.System/);
assert.match(timing, /MIN_PRIMARY_LOADING_MS = 1_200/);
assert.match(timing, /MIN_INLINE_LOADING_MS = 900/);
assert.match(timing, /minimumDuration - \(Date\.now\(\) - startedAt\)/);

console.log('Design mobile validé : accueil, parcours, projet, menu, chargements et animations.');
