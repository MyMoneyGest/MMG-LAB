import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

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
const backupIo = read('src/lib/backup-io.ts');
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
const planLogic = read('src/lib/plan.ts');
const iconGenerator = read('scripts/generate-app-icons.swift');
const actions = read('src/lib/actions.ts');
const goalTypes = read('src/lib/types.ts');
const savingsLocationModal = read('src/components/savings-location-modal.tsx');
const haptics = read('src/lib/haptics.ts');

// Le retour haptique suit UNE RÈGLE (cf. haptics.ts) : vibrer sur un changement
// de donnée du plan qui ne s'annule pas d'un geste, et rien d'autre. Ces
// surfaces ne changent aucune donnée — elles présentent, elles naviguent — donc
// elles restent muettes, et ce sont les plus tentantes pour en ajouter « aussi ».
const screensWithoutHaptics = [
  ['index', index],
  ['new-goal', newGoal],
  ['budget', budget],
  ['app-dialog', appDialog],
  ['feedback-banner', feedbackBanner],
];

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
// Suppression : deux points d'entrée (la ligne du menu et l'écran
// « Ajuster »), une seule implémentation partagée — elle porte un ordre
// sensible aux courses de navigation qu'on ne veut pas voir diverger.
const goalDeletion = read('src/lib/use-goal-deletion.ts');
assert.match(goalDeletion, /export function useGoalDeletion/);
assert.match(goalDeletion, /setPendingFeedback\(\{/);
assert.match(goalDeletion, /Projet supprimé/);
assert.match(goalDeletion, /await removeGoal\(deleted\)/);
assert.match(menu, /useGoalDeletion\(\{ navigate: 'replace' \}\)/);
assert.match(menu, /styles\.deleteAction/);
assert.match(menu, /accessibilityLabel=\{`Supprimer \$\{g\.name\}`\}/);
assert.match(menu, /<AppDialog/);
assert.match(adjustGoal, /useGoalDeletion\(\{ navigate: 'dismissTo' \}\)/);
assert.match(adjustGoal, /label="Supprimer ce projet"/);

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
// Le bouton « Continuer » doit committer un prénom encore en cours de saisie.
// L'écran défile en `keyboardShouldPersistTaps="handled"` : le tap est consommé
// par le bouton SANS retirer le focus au champ, donc `onBlur` ne se déclenche
// pas. Sans cette ligne, un prénom saisi au premier lancement était perdu, et
// il fallait le ressaisir depuis le menu pour le voir sur le tableau de bord.
assert.match(
  country,
  /const save = async \(\) => \{\s*\n\s*if \(saving\) return;(?:\s*\n\s*\/\/[^\n]*)*\s*\n\s*if \(nameEditing\) commitName\(\);/,
  'save() doit committer le brouillon du prénom avant de naviguer'
);
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
// Deux chemins, pour que le défilement ait lieu à chaque choix de pays :
// bloc pas encore monté → on attend son onLayout (position inconnue au tap) ;
// bloc déjà à l'écran → son onLayout ne se redéclenche pas, on défile tout de
// suite avec la position mémorisée.
assert.match(country, /scrollToConversion\.current = true;/);
assert.match(country, /conversionTop\.current = event\.nativeEvent\.layout\.y;/);
assert.match(country, /if \(changingExistingCurrency\) \{/);
assert.match(country, /scrollTo\(\{\s*y: conversionTop\.current,\s*animated: true,?\s*\}\)/);
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
// Sauvegarde et restauration : sans elles, désinstaller l'app efface
// définitivement l'historique. La restauration écrase tout, donc elle passe
// obligatoirement par une confirmation — jamais en un seul geste.
assert.match(menu, /Sauvegarder mes données/);
assert.match(menu, /Restaurer une sauvegarde/);
assert.match(menu, /setPendingRestore\(result\.backup\)/);
assert.match(menu, /title="Remplacer tes données \?"/);
assert.match(menu, /tone="danger"/);
// Et les rappels sont reprogrammés après coup, sinon le plan restauré
// n'émettrait plus jamais la moindre notification.
assert.match(backupIo, /scheduleGoalReminders\(goal, suggestedAmount\(goal\)\)/);
assert.match(backupIo, /await scheduleNudges\(\);/);
// Rien ne quitte le téléphone sans un geste : pas d'envoi réseau ici.
assert.doesNotMatch(backupIo, /fetch\(|supabase/);
assert.match(menu, /pathname: '\/onboarding\/country'/);

// Choisir l'écran où l'on se trouve déjà ferme le menu au lieu d'empiler une
// copie : sinon il fallait autant de retours qu'on avait tapé pour ressortir.
assert.match(menu, /current \? onClose\(\) : go\(onPress\)/);
assert.match(menu, /onGoalScreen\s*\?\s*onClose\(\)/);
assert.match(menu, /currentKey === '\/onboarding\/new-goal'/);
// L'écran pays sert d'accueil ET de réglage sur le même chemin : sans le
// paramètre, le réglage passait pour l'accueil et s'empilait quand même.
assert.match(menu, /function screenKey/);
assert.match(menu, /params\.settings === '1' \? 'country-settings' : 'country-welcome'/);
// `useLocalSearchParams` renvoyait `settings: undefined` sur cette route —
// vérifié dans le navigateur. Ne pas « simplifier » vers la version locale.
assert.match(menu, /useGlobalSearchParams<\{ settings\?: string \}>\(\)/);
// On vise l'appel, pas la mention : le commentaire du fichier cite le hook écarté.
assert.doesNotMatch(menu, /useLocalSearchParams\s*[<(]/);
// Chaque entrée doit annoncer sa cible, sinon la comparaison ne peut pas se faire.
for (const [label, key] of [
  ['Budget', "'/onboarding/budget'"],
  ['Voir un exemple', "'/example'"],
  ['Pays et devise', "'country-settings'"],
  ['Confidentialité', "'/legal'"],
]) {
  assert.ok(
    menu.includes(key),
    `l'entrée ${label} doit déclarer sa clé d'écran ${key}`
  );
}
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
// L'anneau change de teinte selon l'avancement, et la teinte vient d'une seule
// source (`progressColor`). C'est la duplication entre deux composants qui
// avait fait perdre la couleur en passant de la barre à l'anneau.
assert.match(ui, /const ringColor = progressColor\(target\)/);
assert.match(ui, /stroke=\{ringColor\}/);
assert.match(ui, /\{ color: ringColor \}/);
assert.doesNotMatch(
  ui,
  /interpolateColor/,
  "le stroke SVG n'est pas interpolable : react-native-svg ne l'applique qu'à sa valeur initiale"
);
assert.doesNotMatch(ui, /export function ProgressBar/, 'la barre remplacée ne doit pas subsister');
assert.match(ui, /fontVariant: \['tabular-nums'\]/);
assert.match(ui, /duration: target >= 100 \? 1_400 : 650/);
assert.match(ui, /ReduceMotion\.System/);
assert.match(ui, /numberOfLines=\{1\}/);
assert.match(ui, /adjustsFontSizeToFit/);
assert.match(ui, /minimumFontScale=\{0\.82\}/);
assert.match(ui, /minHeight: 44/);
assert.match(ui, /paddingVertical: 12/);
assert.match(ui, /label\?: string/);
// Les quatre paliers, et leur ordre : `find` renvoie le premier seuil atteint,
// donc ils doivent rester du plus haut au plus bas.
assert.match(theme, /export function progressColor/);
assert.match(theme, /\{ from: 100, color: colors\.progress\.complete \}/);
assert.match(theme, /\{ from: 70, color: colors\.progress\.advanced \}/);
assert.match(theme, /\{ from: 35, color: colors\.progress\.steady \}/);
assert.match(theme, /\{ from: 0, color: colors\.progress\.start \}/);

// Et le comportement réel, pas seulement la présence du code : c'est la valeur
// rendue aux bornes de chaque palier qui compte.
{
  const compiled = ts.transpileModule(theme, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = { exports: {} };
  new Function('exports', 'module', compiled)(loaded.exports, loaded);
  const { progressColor, colors: palette } = loaded.exports;

  assert.equal(progressColor(0), palette.progress.start);
  assert.equal(progressColor(34.9), palette.progress.start);
  assert.equal(progressColor(35), palette.progress.steady);
  assert.equal(progressColor(69.9), palette.progress.steady);
  assert.equal(progressColor(70), palette.progress.advanced);
  assert.equal(progressColor(99.9), palette.progress.advanced);
  assert.equal(progressColor(100), palette.progress.complete);
  // Un objectif dépassé reste « atteint », et un pourcentage aberrant ne casse rien.
  assert.equal(progressColor(140), palette.progress.complete);
  assert.equal(progressColor(-10), palette.progress.start);
  assert.equal(progressColor(Number.NaN), palette.progress.start);
}

// `background` est le fond d'écran, `field` les surfaces en creux posées sur une
// carte (saisies, recherche, pastilles). Les deux ne se confondaient que tant que
// le fond était quasi blanc : dès qu'on le teinte, chaque champ devient une
// pastille colorée. Seuls le navigateur et le conteneur d'écran peuvent porter
// `background`.
assert.match(theme, /field: '#F3F0E9'/);
// Une carte doit se distinguer de la page. Faute d'ombre ou de relief, il n'y a
// que deux moyens : un écart de remplissage, ou un contour franc. Le test
// accepte l'un OU l'autre — la palette est passée par les deux — mais jamais
// aucun des deux : la version publiée avait 1,93 de luminance d'écart sur 255
// (0,8 %) et un filet `hairlineWidth`, et les sections se confondaient.
{
  const hex = (name) => theme.match(new RegExp(`${name}: '(#[0-9A-F]{6})'`))[1];
  const lum = (h) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const remplissage = Math.abs(lum(hex('card')) - lum(hex('background')));
  const contour = Math.abs(lum(hex('border')) - lum(hex('card')));

  if (remplissage <= 8) {
    // Cartes détourées : le contour porte toute la structure de l'écran.
    assert.ok(
      contour > 20,
      `cartes et page ont le même remplissage (${remplissage.toFixed(2)}) : le contour doit alors être franc, il n'est qu'à ${contour.toFixed(2)}`
    );
    // Et il doit être tracé en pixel plein. `hairlineWidth` vaut 0,33 px sur un
    // écran 3x : irrégulier, parfois invisible selon la luminosité.
    assert.match(
      ui,
      /borderRadius: radius\.card,\n\s*borderWidth: 1,/,
      'un contour qui porte seul la séparation ne peut pas être en hairlineWidth'
    );
  }

  // Les surfaces posées SUR la carte doivent s'en distinguer, sinon la mise en
  // avant et le creux disparaissent tous les deux.
  for (const name of ['cardSoft', 'field']) {
    const interne = Math.abs(lum(hex(name)) - lum(hex('card')));
    assert.ok(interne > 5, `${name} doit rester visible sur une carte (écart ${interne.toFixed(2)})`);
  }
}
assert.match(ui, /backgroundColor: colors\.field/);
for (const [name, source] of [
  ['country-list', read('src/components/country-list.tsx')],
  ['calendar-modal', read('src/components/calendar-modal.tsx')],
  ['new-goal', newGoal],
  ['goal', goal],
  ['country', country],
]) {
  assert.doesNotMatch(
    source,
    /backgroundColor: colors\.background/,
    `${name} : une surface en creux doit utiliser colors.field, pas le fond d'écran`
  );
}

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
// L'étape 2 s'appelle « Rythme » seulement quand il y en a un. En mode libre et
// en montant fixé, il n'y a pas de rythme à choisir : annoncer une étape qui
// n'existe pas est une promesse non tenue dès le premier écran.
assert.match(newGoal, /savingsMode === 'free' \|\| planMode === 'amount'/);
// --- Double sens du calcul (chantier onb-double-sens) ----------------------
// Le seul motif récurrent du journal : demandé par Patrick le 13/08 puis par
// David le 01/11 sans qu'ils se connaissent.
assert.match(newGoal, /Je fixe la date/);
assert.match(newGoal, /Je fixe mon montant/);
assert.match(newGoal, /MONTANT MENSUEL|Montant mensuel/);
// Le sens par date reste le DÉFAUT : il aide celui qui ne sait pas combien il
// peut mettre, et c'est le parcours que les testeurs connaissent déjà.
assert.match(newGoal, /useState<PlanMode>\('date'\)/);
// Le montant tapé est emporté tel quel, et jamais en mode libre.
assert.match(newGoal, /planMode === 'amount' && savingsMode === 'guided' \? parsedMonthly!/);
// ⚠️ Le rythme DOIT disparaître dans ce sens : « 200 € par mois » redeviendrait
// ambigu (premier versement ? moyenne ? plus gros ?) si on proposait en plus un
// rythme progressif. Le bloc est masqué et l'app dit pourquoi.
assert.match(newGoal, /savingsMode === 'guided' && planMode === 'date' \? \(/);
assert.match(newGoal, /Tu as fixé ton montant, il est donc le même chaque mois/);
// L'annonce compte les versements pleins à part du reliquat : « 18 versements
// de 200 €, le dernier de 100 € » se lirait comme dix-neuf versements.
assert.match(newGoal, /\{fullMonthlyCount\} versement/);
assert.match(newGoal, /puis \$\{money\(lastMonthlyPart\)\}/);
assert.match(newGoal, /\['Projet', 'Rappel'\]\s*:\s*\['Projet', 'Rythme'\]/);
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
// Porte de sortie vers l'explication. L'écran existait depuis le début mais
// n'était atteignable que par le menu — un développeur l'a réclamé 18 minutes
// durant sans savoir qu'il était là. Le lien doit rester SOUS le formulaire et
// sur la seule étape 1 : devant, il redeviendrait l'étape imposée que la
// décision du 13/08 a supprimée.
assert.match(newGoal, /pathname: '\/example', params: \{ from: 'new-goal' \}/);
assert.match(newGoal, /Pas sûr \? Voir un exemple de plan/);
assert.match(newGoal, /accessibilityRole="link"/);
// Et le retour depuis l'exemple ne doit pas empiler un SECOND formulaire par
// -dessus celui d'où l'on vient. Mesuré à l'écran le 11/11 : `router.navigate`
// ne démonte PAS le premier (deux formulaires montés après l'aller-retour),
// malgré une doc qui annonce qu'il remonte à une route déjà empilée. D'où le
// paramètre `from` et le retour explicite — et le repli `navigate` pour l'autre
// porte d'entrée, le menu, derrière laquelle il n'y a aucun formulaire.
const example = read('src/app/example.tsx');
assert.match(example, /useLocalSearchParams<\{ from\?: string \}>\(\)/);
assert.match(example, /from === 'new-goal' && router\.canGoBack\(\)/);
assert.match(example, /router\.back\(\)/);
assert.match(example, /router\.navigate\('\/onboarding\/new-goal'\)/);
// Retour depuis l'étape 2 : revient à l'étape 1 au lieu de quitter l'écran.
assert.match(newGoal, /onBack=\{step === 2 \? \(\) => setStep\(1\) : undefined\}/);
assert.match(header, /onBack\?: \(\) => void/);
// Choisir un type dans la liste écrase le nom déjà saisi.
assert.doesNotMatch(newGoal, /!name\.trim\(\) \|\| nameIsSuggested/);
// Jour de rappel ordinal (« le 1er », pas « le 1 »).
assert.match(newGoal, /Rappel le <Text style=\{styles\.dayHintAccent\}>\{formatReminderDay\(reminderDay\)\}/);
// Le démarrage et le rythme font partie de la décision de création : ni l'un ni
// l'autre ne doit retourner se replier derrière « Options avancées ».
assert.doesNotMatch(newGoal, /Options avancées|advancedOpen|rhythmAdvancedOpen/);
assert.match(newGoal, /<Text style=\{styles\.fieldLabel\}>Quand veux-tu commencer \?<\/Text>/);
assert.match(newGoal, /<Text style=\{styles\.fieldLabel\}>Rythme des versements<\/Text>/);
// Et le montant proposé dit d'où il vient.
assert.match(newGoal, /Les montants proposés se calculent sur ton objectif/);
// L'invite du prénom ne s'affiche que tant qu'il est vide.
assert.match(country, /\{userName \? null : \(/);
assert.match(country, /Touche « Ton prénom » pour personnaliser l'app/);
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
assert.match(goal, /label=\{`J'ai mis de côté ✓ \(\$\{glance\(suggested\)\}\)`\}/);
assert.match(goal, /label="J'ai mis de côté ✓"/);
// Fiche projet : en-tête « Bonjour, {prénom} » + marque à droite (accès au
// menu), statut du projet en pastille, titre en serif italique, et les trois
// repères chiffrés (objectif / restant / échéance) groupés sous l'anneau.
assert.match(goal, /<AppHeader greeting currentGoalId=\{goal\.id\}/);
assert.match(header, /greeting\?: boolean/);
assert.match(header, /styles\.greetingRow/);
assert.match(header, /userName \? `\$\{userName\} ✨`/);
assert.match(header, /titleSerif/);
assert.match(header, /fonts\.serifBold/);
assert.match(goal, /styles\.statusPill/);
assert.match(goal, /styles\.projectName/);
assert.match(goal, /styles\.statsRow/);
assert.match(goal, />Objectif</);
assert.match(goal, />Restant</);
assert.match(goal, />Échéance</);
assert.match(goal, /Objectif mensuel/);
assert.match(goal, /CATEGORY_EMOJI\[goal\.category\]/);
assert.match(goalTypes, /export const CATEGORY_EMOJI/);
assert.match(goal, /\+ Ajouter un montant libre/);
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
assert.match(goal, /'Rappel modifié'/);
// Heure du rappel réglable par projet (chantier liv-heure-reglable). L'écran
// doit afficher l'heure DU PROJET, jamais la constante : afficher 9 h pendant
// qu'une notification part à 20 h serait pire que de ne rien afficher.
assert.match(goal, /reminderTimeLabel\(goalReminderHour\(goal\)\)/);
assert.doesNotMatch(goal, /REMINDER_TIME_LABEL/);
assert.match(goal, /currentHour=\{goalReminderHour\(goal\)\}/);
assert.match(goal, /changeReminderDay\(currentGoal, day, hour\)/);
const reminderModal = read('src/components/reminder-day-modal.tsx');
assert.match(reminderModal, /REMINDER_HOURS/);
assert.match(reminderModal, /accessibilityRole="radio"/);
// ⚠️ Une heure venue d'ailleurs (restauration, version future) doit rejoindre
// la liste au lieu d'être perdue en silence à l'ouverture du modal.
assert.match(reminderModal, /\[\.\.\.REMINDER_HOURS, currentHour\]\.sort/);
assert.match(goal, /MIN_INLINE_LOADING_MS/);
assert.match(goal, /waitForMinimumLoading\(loadingStartedAt\)/);
assert.match(goal, /accessibilityRole="tab"/);
// Onglets illustrés (tracés SVG : pas de librairie d'icônes dans le projet).
assert.match(goal, /<Icon color=\{active \? colors\.accent : colors\.textSecondary\}/);
assert.match(read('src/components/tab-icons.tsx'), /export function HomeIcon/);
// Masquage des montants (chantier liv-solde-masque). `glance` masque, `money`
// ne masque pas : la distinction est le cœur de la fonctionnalité, et les trois
// montants lisibles sans rien toucher doivent passer par `glance`.
assert.match(goal, /<ProgressRing pct=\{pct\} amount=\{glance\(saved\)\}/);
assert.match(goal, /\{glance\(goal\.targetAmount\)\}/);
assert.match(goal, /\{glance\(remaining\)\}/);
assert.match(menu, /\{glance\(remainingAmount\(g\)\)\} restants/);
// L'œil commande le masquage depuis l'écran, contre les chiffres qu'il protège.
assert.match(goal, /accessibilityState=\{\{ checked: hideAmounts \}\}/);
assert.match(goal, /setHideAmounts\(!hideAmounts\)/);
// ⚠️ Et SUR CET ÉCRAN, plus un seul `money(` : tout s'y affiche sans qu'on ait
// rien touché. Masquer l'anneau en laissant « Objectif mensuel 583,34 € » en
// gros juste dessous ne protégerait de rien — le défaut a existé une heure.
assert.doesNotMatch(goal, /\bmoney\(/);
// ⚠️ Les modales de saisie ne doivent JAMAIS masquer : on les ouvre exprès, et
// masquer ce qu'on est en train de taper rendrait l'app inutilisable.
for (const [name, source] of [
  ['amount-modal', read('src/components/amount-modal.tsx')],
  ['balance-modal', read('src/components/balance-modal.tsx')],
]) {
  assert.doesNotMatch(source, /glance\(/, `${name} ne doit pas masquer sa saisie`);
}
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
assert.match(goal, /Jour de rappel : le \{formatReminderDay\(goal\.reminderDay\)\} à\{' '\}/);
assert.match(planSummary, /Le \$\{formatReminderDay\(reminderDay\)\} du mois, à \$\{REMINDER_TIME_LABEL\}/);
// L'heure du rappel est annoncée partout où le jour l'est : elle était codée en
// dur à 9 h et jamais dite, un testeur a dû demander « à quelle heure ? ».
// La fiche projet dit celle DU PROJET (assertion plus haut) ; le récap de plan
// et l'écran de création parlent avant qu'un projet existe, donc la constante.
assert.match(newGoal, /chaque mois, à \{REMINDER_TIME_LABEL\}/);
assert.match(planLogic, /export const REMINDER_HOUR = 9;/);
assert.doesNotMatch(planLogic, /, 9, 0, 0, 0\)|setHours\(9,/);
assert.match(adjustGoal, /Le \$\{formatReminderDay\(goal\.reminderDay\)\}/);
// --- Bulles d'aide contextuelles (chantier onb-bulles-aide) ----------------
// Un seul motif d'aide dans l'app : la pastille « i » qui ouvre une
// explication. L'explication du solde réel, écrite à la main, passe par le
// composant partagé — deux motifs qui se ressemblent vaudraient moins qu'un.
assert.match(goal, /<HelpDot/);
assert.match(goal, /label="Expliquer le solde réel"/);
assert.match(goal, /À quoi sert le solde réel/);
assert.match(goal, /Rien n’est connecté à ta banque/);
assert.doesNotMatch(goal, /balanceInfoOpen/);
const helpDot = read('src/components/help-dot.tsx');
// ⚠️ Muette par défaut : rien ne s'ouvre tant que personne ne touche. Un
// tutoriel qui se lance tout seul est un tutoriel qu'on referme.
assert.match(helpDot, /useState\(false\)/);
assert.doesNotMatch(helpDot, /useEffect/);
// Le seul emplacement retenu par Patrick : « Déjà disponible » à la création.
// Le champ n'avait aucune explication, et confondre « pour ce projet » avec
// « tout mon argent » fausse le plan entier sans que rien ne le signale.
assert.match(newGoal, /<HelpDot/);
assert.match(newGoal, /Ce que tu as déjà pour CE projet/);
assert.match(newGoal, /pas tout ton argent/);
// ⚠️ Pas de prolifération : la tentation, avec ce composant sous la main, est
// d'en semer partout — un écran couvert de « i » dit que rien n'est clair.
const helpDotCount = (src) => (src.match(/<HelpDot/g) ?? []).length;
assert.equal(helpDotCount(newGoal) + helpDotCount(goal), 2, 'deux bulles, pas plus');
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
assert.match(goalDeletion, /feedback: 'deleted'/);
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
// Retour haptique : à l'apparition de l'écran, et distinct quand l'objectif
// est atteint. Il ne doit rester qu'à cet endroit — vibrer sur la navigation
// ordinaire userait l'effet.
assert.match(confirmation, /if \(done\) hapticGoalReached\(\);/);
assert.match(confirmation, /else hapticContributionLogged\(\);/);
assert.match(haptics, /NotificationFeedbackType\.Success/);
assert.match(haptics, /ImpactFeedbackStyle\.Medium/);
assert.match(haptics, /\.catch\(\(\) => \{\}\)/, 'une vibration ratée ne doit jamais faire échouer un versement');
for (const [name, source] of screensWithoutHaptics) {
  assert.doesNotMatch(source, /haptic/i, `${name} ne doit pas vibrer : l'effet vient de la rareté`);
}

// --- La règle haptique, étendue le 12/11 (chantier liv-haptique-etendu) ----
// Quatre intensités, et chacune a sa raison d'être distincte.
assert.match(haptics, /export function hapticSettingApplied/);
assert.match(haptics, /Haptics\.selectionAsync\(\)/);
assert.match(haptics, /export function hapticDestructive/);
assert.match(haptics, /NotificationFeedbackType\.Warning/);
// La règle est ÉCRITE, pas déduite d'une liste : c'est ce qui permet de trancher
// un nouvel écran sans rouvrir le débat.
assert.match(haptics, /ne s'annule pas/);

// Les huit gestes qui engagent une donnée du plan, un appel chacun.
const gestesQuiEngagent = [
  ['suppression d’un projet', read('src/lib/use-goal-deletion.ts'), 'hapticDestructive'],
  ['restauration d’une sauvegarde', menu, 'hapticDestructive'],
  ['report d’échéance', read('src/components/report-modal.tsx'), 'hapticSettingApplied'],
  ['fiche projet (solde, réajustement, rappel)', goal, 'hapticSettingApplied'],
  ['ajustement d’un projet', adjustGoal, 'hapticSettingApplied'],
  ['changement de pays', country, 'hapticSettingApplied'],
];
for (const [nom, source, helper] of gestesQuiEngagent) {
  assert.match(source, new RegExp(`${helper}\\(\\)`), `${nom} doit vibrer`);
}
// La fiche projet en a exactement trois : solde réel, réajustement, rappel.
assert.equal((goal.match(/hapticSettingApplied\(\)/g) ?? []).length, 3);
// ⚠️ Et UNE seule par geste : ajuster un projet enchaîne deux actions
// instrumentées en interne, l'écran ne doit vibrer qu'une fois.
assert.equal((adjustGoal.match(/haptic\w+\(\)/g) ?? []).length, 1);

// ⚠️ Ce qui s'annule d'un geste ne vibre PAS. Les deux interrupteurs de l'app
// sont le test de la règle : on les rebascule aussitôt, et une vibration par
// bascule serait exactement le bruit qu'on fuit.
assert.doesNotMatch(goal, /toggleMidCycleNudge[\s\S]{0,400}haptic/);
assert.doesNotMatch(goal, /setHideAmounts\(!hideAmounts\)[\s\S]{0,120}haptic/);
// Un RETRAIT ne vibre pas : un succès y serait déplacé, un avertissement serait
// un reproche — et MMG promet « même moins que prévu, c'est déjà bien ».
assert.match(haptics, /Un RETRAIT ne vibre pas/);
// La pulsation du versement reste le privilège de l'écran de confirmation.
assert.equal((goal.match(/hapticContributionLogged/g) ?? []).length, 0);
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
