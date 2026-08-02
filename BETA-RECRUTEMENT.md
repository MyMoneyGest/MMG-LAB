# Kit de diffusion bêta — MMG

> **Décision du 2026-07-31 — séparation impérative des cohortes**
>
> Le formulaire Tally et les messages « recherche de testeurs » ci-dessous sont conservés
> uniquement pour la cohorte de **rodage technique** déjà lancée sur `r/BetaTests` et son
> Discord. Ils ne doivent pas être utilisés pour la décision produit.
>
> La cohorte de **décision** doit venir de communautés budget/épargne et recevoir MMG comme un
> outil fini : transparence sur Patrick comme créateur, lien Android direct, aucun formulaire,
> aucun engagement de test et aucune consigne artificielle sur les rappels. Le lien iPhone ne
> sera ajouté qu'après validation Apple du build 4.

Document de travail pour recruter des testeurs Android et iPhone sans présenter MMG comme un
produit bancaire. Aucun message public ne doit être copié partout à l'identique : l'adapter aux
règles et au ton de chaque communauté.

## État de la distribution

- Android : build EAS `1baebe04-dd8f-4ff9-9a48-653959d90e71`, version `1.0.0` (build 1),
  profil `preview`, créé depuis le commit `9f332d1`.
- Fichier local publié :
  `/Users/patrickngouala/Downloads/MMG-beta-Android-1.0.0.apk`.
- Release GitHub :
  <https://github.com/MyMoneyGest/MMG-LAB/releases/tag/android-beta-v1.0.0>.
- Téléchargement direct de l'APK :
  <https://github.com/MyMoneyGest/MMG-LAB/releases/download/android-beta-v1.0.0/MMG-beta-Android-1.0.0.apk>.
- SHA-256 Android :
  `5eb46a303b8a84cf24abd863a065ea7ed43d1ac07badc7a83d5ff0613530092e`.
- iPhone : lien TestFlight préparé, mais build encore en Beta App Review. Limite volontaire
  du lien public : 200 testeurs. Ne pas annoncer que l'accès est ouvert avant son activation.
  Pour recevoir l'invitation, le testeur doit fournir l'adresse e-mail associée au compte
  Apple utilisé sur son iPhone.

## Formulaire Tally

- Formulaire publié et vérifié : <https://tally.so/r/vGVapv>

### Titre

**Tester MMG — bêta Android et iPhone**

### Introduction

MMG est une application gratuite qui aide à préparer un projet d'épargne avec un plan mensuel,
des rappels et un suivi manuel. Elle ne se connecte pas à votre banque et ne demande aucun
identifiant bancaire.

La bêta Android est disponible. La bêta iPhone, limitée volontairement à 200 places, sera
envoyée dès que sa vérification TestFlight par Apple sera terminée. Ce formulaire prend environ
deux minutes et ne demande aucun montant de revenu, de budget ou d'épargne.

### Questions

1. **Prénom ou pseudonyme** — réponse courte, obligatoire.
2. **Adresse e-mail** — e-mail, obligatoire.
   Aide : « Uniquement pour vous envoyer l'accès à la bêta et les informations essentielles du
   test. Pour tester sur iPhone, indiquez impérativement l'adresse e-mail associée au compte
   Apple utilisé sur l'appareil. »
3. **Sur quelle plateforme souhaitez-vous tester MMG ?** — choix unique, obligatoire :
   - Android
   - iPhone
   - Les deux
4. **Modèle du téléphone** — réponse courte, facultative.
   Exemple : « Samsung Galaxy S24, iPhone 15 ».
5. **Version du système** — réponse courte, facultative.
   Exemple : « Android 15, iOS 19 ».
6. **Avez-vous actuellement un projet pour lequel vous souhaitez mettre de l'argent de côté ?**
   — choix unique, obligatoire :
   - Oui
   - Pas encore, mais j'en prépare un
   - Non, je veux surtout découvrir l'application
7. **Quel type de projet ?** — choix multiple, facultatif :
   - Fonds d'urgence
   - Voiture
   - Déménagement
   - Vacances
   - Autre
   - Je préfère ne pas répondre
8. **Si vous êtes sur Android, êtes-vous à l'aise avec l'installation temporaire d'un APK hors
   Play Store ?** — choix unique :
   - Oui
   - Oui, avec un guide pas à pas
   - Non
   - Non concerné
9. **Quel retour pourriez-vous nous faire ?** — choix multiple, obligatoire :
   - Signaler les bugs ou blocages
   - Dire ce qui est difficile à comprendre
   - Donner mon avis après un mois d'utilisation
   - Tester les rappels mensuels
10. **Commentaire ou attente particulière** — texte long, facultatif.
11. **Accord de participation** — case obligatoire :
    « Je comprends qu'il s'agit d'une version bêta, que MMG n'est ni une banque ni un service
    de conseil financier, et j'accepte de recevoir les informations nécessaires au test. »

### Notice placée avant le bouton d'envoi

Les réponses servent uniquement à organiser le test MMG. Elles ne sont pas revendues et ne
contiennent aucune donnée bancaire. Elles seront supprimées au plus tard 30 jours après la fin
de la bêta. Vous pouvez demander leur suppression à tout moment à
`mymoneygest@gmail.com`.

### Message après envoi

Merci !

- Android : vous recevrez le lien de téléchargement et le guide d'installation.
- iPhone : vous êtes inscrit sur la liste d'attente ; le lien TestFlight sera envoyé dès que
  le build sera validé par Apple. La bêta iPhone est limitée à 200 places.

## GitHub Release Android

### Nom et tag

- Tag : `android-beta-v1.0.0`
- Titre : `MMG — bêta Android 1.0.0`
- Pièce jointe : `MMG-beta-Android-1.0.0.apk`

### Description

Première bêta publique Android de MMG — MyMoneyGest.

MMG aide à transformer un projet d'épargne en un rythme mensuel réaliste : estimation d'une
capacité prudente, création d'un plan, rappels locaux, confirmation manuelle des versements et
ajustement de la progression.

**À savoir**

- application gratuite et sans publicité pendant la bêta ;
- aucun compte MMG à créer ;
- aucune connexion bancaire ;
- aucun virement automatique : l'utilisateur garde la main ;
- les données de budget, projets et versements restent sur le téléphone ;
- quelques événements d'usage pseudonymisés sont transmis, sans montant réel ni donnée
  bancaire, afin d'évaluer la bêta.

Android signalera que l'application provient d'une source extérieure au Play Store. Vérifiez le
nom du fichier et son empreinte avant l'installation.

**SHA-256**

`5eb46a303b8a84cf24abd863a065ea7ed43d1ac07badc7a83d5ff0613530092e`

Contact et demandes relatives aux données : `mymoneygest@gmail.com`.

## Message préalable aux modérateurs

Bonjour,

Je développe MMG, une application gratuite de suivi manuel de projets d'épargne, sans connexion
bancaire, sans publicité et actuellement en bêta. Je cherche un petit nombre de testeurs Android
et iPhone afin d'évaluer si le principe est réellement utile sur plusieurs mois.

Avant de publier quoi que ce soit, je souhaite vérifier que ce type d'appel à testeurs est
autorisé ici. Le message identifiera clairement que je suis le créateur, expliquera les données
collectées et ne contiendra aucune offre commerciale, aucun parrainage ni produit financier.

M'autorisez-vous à publier un sujet unique avec un lien vers le formulaire de recrutement ? Je
respecterai naturellement le format ou les conditions que vous m'indiquerez.

Merci,
Patrick

## Publication longue — forums traditionnels

### Titre

**J'ai créé une application pour suivre ses projets d'épargne — recherche de bêta-testeurs**

### Message

Bonjour à tous,

Je préfère l'indiquer immédiatement : je suis le créateur de l'application présentée ici, MMG.
Je publie cet appel avec l'accord de la modération afin de rechercher des testeurs, pas pour
faire passer une publicité pour un témoignage d'utilisateur.

Entre les mois plus serrés, les imprévus et le manque de visibilité, il est facile de perdre le
fil d'un projet d'épargne. Le virement automatique convient très bien à beaucoup de personnes,
mais pas à toutes. J'ai donc voulu conserver le geste volontaire tout en lui donnant un cadre.

MMG estime une capacité d'épargne prudente à partir du budget indiqué, puis propose un plan
mensuel stable, progressif ou régressif. Un rappel invite ensuite à effectuer soi-même le
versement depuis sa banque. Une fois le geste confirmé dans MMG, la progression et le plan se
mettent à jour.

MMG n'est pas une banque : l'application ne détient pas d'argent, ne se connecte à aucun compte,
ne demande aucun identifiant bancaire et ne réalise aucun virement. Les budgets, projets et
versements restent sur le téléphone. Quelques événements d'usage pseudonymisés sont transmis
pour évaluer la bêta, sans montant réel ni donnée bancaire.

La bêta est gratuite et sans publicité. Android est disponible dès maintenant. L'accès iPhone,
limité volontairement à 200 places, sera envoyé dès la validation TestFlight par Apple.

Formulaire de participation : **<https://tally.so/r/vGVapv>**

Même un avis critique sur le principe m'est utile : si vous pensez qu'un tableur suffit ou que
le suivi entièrement manuel n'apporte rien, je préfère le savoir.

Merci,
Patrick

## Publication courte — Reddit ou Discord autorisant l'autopromotion

**Titre :** Je cherche des testeurs pour une app de projets d'épargne sans connexion bancaire

Je développe MMG, une petite app gratuite pour transformer un objectif d'épargne en plan mensuel
et suivre manuellement les versements. Elle ne se connecte pas aux banques, ne demande aucun
compte MMG et n'effectue aucun virement.

Je cherche des personnes ayant un vrai projet à préparer et prêtes à me dire, après usage, si le
rituel mensuel est utile ou si un simple tableur ferait aussi bien. Android est disponible ;
iPhone ouvrira après validation TestFlight, avec une limite volontaire de 200 places.

Formulaire de participation : **<https://tally.so/r/vGVapv>**

Je suis le créateur et répondrai volontiers aux questions techniques ou de confidentialité.

## Publication r/BetaTests

- Publication créée le 31 juillet 2026 avec le compte Reddit `u/L-45-VY` :
  <https://www.reddit.com/r/betatests/comments/1vbnmim/opportunity_frenchspeaking_android_testers_wanted/>
- Titre publié :
  `[opportunity] French-speaking Android testers wanted for MMG, a manual savings-goal app
  (iPhone waitlist open)`.
- Le texte précise dès le premier paragraphe que MMG est une application en français et cible
  explicitement les testeurs francophones.
- État au moment de la publication : en attente de validation par la modération de
  `r/BetaTests`.
- `r/BetaTests` accepte les appels à bêta-testeurs. Le compte doit avoir au moins 24 heures et
  2 points de karma.
- MoneyVox interdit les contributions publicitaires, commerciales ou de prospection : ne pas y
  publier sans autorisation explicite de la modération.
- `r/vosfinances` a refusé l'autorisation le 2 août 2026 à 07:19 CEST après lecture du texte
  complet : la communauté n'autorise aucun partage d'outil, même non encore commercial.
  Décision définitive : ne pas publier et ne pas contourner ce refus.
- `r/AskFrance` interdit l'autopromotion et les panels de test ; ne pas y publier.
- `r/FranceFinance` est en publication restreinte ; contacter la modération avant tout message.

## Publication Discord BetaTests Community

- Serveur rejoint avec le compte Discord `l45vy_01133` et les rôles Android et iOS.
- Salon de diffusion : `#post-your-product-here` :
  <https://discord.com/channels/1405234773449773077/1412101252317184184>
- Message MMG publié le 31 juillet 2026 sous le nom d'affichage `l45vy`.
- Le message précise que l'application est en français, recherche des testeurs francophones,
  présente les accès Android/iPhone et renvoie directement vers le formulaire Tally.
- Règles propres au salon respectées : tous les liens figurent directement dans le message,
  aucun renvoi vers les messages privés, lien non masqué, une seule application présentée et
  aucune conversation annexe dans ce salon.
- Le salon applique un délai initial de 10 minutes aux nouveaux membres et un mode lent de
  6 heures entre deux publications.

## Ordre de diffusion

1. Formulaire Tally et Release Android finalisés.
2. Demande d'autorisation aux modérateurs avant toute publication.
3. Discords et groupes Facebook disposant d'un canal d'autopromotion explicite : publication
   effectuée dans `BetaTests Community`, salon `#post-your-product-here`.
4. MoneyVox uniquement après lecture de la charte et accord si nécessaire.
5. Reddit uniquement dans les communautés autorisant le message : publication effectuée sur
   `r/BetaTests` ; ne pas publier dans `r/vosfinances` ou `r/AskFrance` sans autorisation
   explicite.
6. Hardware.fr après lecture du topic et de ses règles locales.
7. Relance iPhone seulement lorsque le lien TestFlight est réellement actif.
