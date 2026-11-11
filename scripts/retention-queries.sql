-- ============================================================================
--  MMG — Requêtes SQL de suivi de rétention et d'entretien de la table events
-- ============================================================================
--
--  Où lancer ces requêtes : Supabase → projet MMG-LAB → SQL Editor.
--  (L'app, elle, ne peut qu'AJOUTER des lignes ; lire et supprimer se fait ici,
--   depuis le dashboard qui a tous les droits.)
--
--  Rappel des événements enregistrés (table `events`) :
--    app_open, goal_created, contribution_logged, reminder_opened,
--    reminder_postponed, balance_confirmed, rebalance_decided, goal_deleted,
--    nudge_shown.
--  ⚠️ nudge_shown = affichage d'un coup de pouce (relance douce). Ce N'EST PAS un
--     signal d'activité/rétention : ne JAMAIS le compter comme un retour. Les
--     requêtes de rétention ci-dessous s'appuient sur contribution_logged (dépôt),
--     donc l'excluent déjà ; il sert seulement à analyser l'effet des coups de pouce
--     (par déclencheur A/B), pas à mesurer l'implication.
--  Colonnes utiles : install_id (qui), event_type (quoi), created_at (quand),
--    platform, app_version, metadata (détails en JSON).
--  Clés metadata connues :
--    app_open             → country, currencyCode
--    goal_created         → category, rhythm, savingsMode, activationDelayDays,
--                           country, currencyCode
--    contribution_logged  → type ('deposit'/'withdrawal'), source
--       (AUCUN montant transmis, même en tranche : seul le fait qu'un versement a
--        eu lieu est enregistré. La mesure de rétention n'a besoin que de ça.)
--    rebalance_decided    → choice ('applied'/'kept'/'deferred')
--    nudge_shown          → trigger ('mid_cycle'/'inactivity')
--
--  Principe de mesure (brief §5) : rétention au 3e rappel mensuel.
--    Dénominateur = personnes ayant créé un projet.
--    Numérateur   = celles encore actives (elles font le geste) au 3e rappel.
--    Seuils de décision : ≥ 40 % = bon signal | 20-40 % = zone grise | < 20 % = négatif.
-- ============================================================================


-- ############################################################################
-- SECTION 0 — ENTRETIEN DE LA BASE (à lancer à la main, au bon moment)
-- ############################################################################

-- 0.a  AVANT LE LANCEMENT : vider les données de test.
--      À faire UNE SEULE FOIS, juste avant de partager le lien de l'app —
--      après tes propres tests, sinon tu re-salis la table. « restart identity »
--      remet aussi le compteur d'id à zéro.
--      ⚠️ Irréversible. À ce stade tout est du test, donc c'est sans risque.
--
--   truncate table events restart identity;
--
--      (Décommente la ligne ci-dessus pour l'exécuter.)


-- 0.b  ENTRETIEN RGPD : purge AUTOMATIQUE des événements de plus de 12 mois.
--      La page Confidentialité annonce une conservation de 12 mois maximum. Une
--      purge manuelle « de temps en temps » ne garantit pas cette promesse ; on
--      l'automatise avec pg_cron (extension dispo sur Supabase). À FAIRE UNE FOIS :
--
--      -- 1) activer l'extension (Dashboard → Database → Extensions, ou SQL) :
--      create extension if not exists pg_cron;
--      -- 2) planifier une purge quotidienne à 3h UTC :
--      select cron.schedule(
--        'purge_events_12_mois', '0 3 * * *',
--        $$ delete from events where created_at < now() - interval '12 months' $$
--      );
--
--      Purge manuelle immédiate si besoin :
--   delete from events where created_at < now() - interval '12 months';
--
--      Vérifier / retirer la tâche : select * from cron.job;
--                                    select cron.unschedule('purge_events_12_mois');


-- 0.d  DROIT À L'EFFACEMENT / OPPOSITION (RGPD) : suppression des lignes d'UNE personne.
--      Quand quelqu'un écrit pour exercer ses droits, il joint son « identifiant de
--      suivi » (affiché et copiable dans l'écran Confidentialité de l'app = install_id).
--      Remplace la valeur ci-dessous par celui qu'il t'a communiqué :
--
--   delete from events where install_id = 'install-XXXXXXXXXXXX-xxxxxxxxxx';
--
--      Vérifier avant de supprimer (compter ses lignes) :
--   select count(*) from events where install_id = 'install-XXXXXXXXXXXX-xxxxxxxxxx';


-- 0.c  ⭐ À LANCER UNE FOIS : la vue « events_reels » (sans tes appareils de test).
--      Chaque INSTALLATION a son propre install_id (ton Android et un simulateur
--      iPhone = deux identifiants différents). Toi, tu ouvres l'app en permanence :
--      si tu restes dans la mesure, tu gonfles artificiellement la rétention.
--      Cette vue écarte tes installations une bonne fois pour toutes ; toutes les
--      requêtes de mesure ci-dessous l'utilisent à la place de « events ».
--
--      Pour ajouter un appareil à exclure plus tard : relance ce bloc en ajoutant
--      son install_id à la liste (garde la virgule entre chaque).
--
--      ⚠️ Cette liste est une dette, pas une solution. CHAQUE réinstallation de
--      Patrick crée un identifiant neuf qui compte dans la rétention jusqu'à ce
--      que quelqu'un pense à l'ajouter ici — c'est arrivé le 11/11 : le nouveau
--      2.2.0 de son Android a créé un projet mesuré comme celui d'un inconnu.
--      La sortie est `dette-flag-test`, livré le 11/11 : à partir de la 2.3.0,
--      installer le build `preview-test` sur son propre téléphone suffit, il
--      porte `test_build: true` et s'exclut tout seul, pour toujours. Voir 0.f.

--      ⚠️ SÉCURITÉ : « security_invoker = true » est indispensable. Sans lui, la vue
--      s'exécuterait avec les droits de son créateur et contournerait la règle
--      « insert seulement » de la table events — rendant tous les événements
--      lisibles par la clé publique de l'app. Le REVOKE est une sécurité de plus.

create or replace view events_reels
with (security_invoker = true) as
select *
from events
where install_id not in (
  'install-1784788834062-uklf43hsnw',  -- Patrick — ancien install, téléphone habituel
  'install-1787134036038-1qnk2xwqzp',  -- Patrick — second téléphone de test (19/08/2026)
  'install-1787134747711-1dwxyrgrut',  -- Patrick — téléphone habituel, APK 2.0.0 (19/08/2026)
  'install-1789548913830-mg7iwwsefz',  -- Patrick — Android, APK 2.1.0 (16/09/2026)
  'install-1794432770361-jk4fh4ttbm'   -- Patrick — Android, 2.2.0 (11/11/2026, 21h32)
  -- , 'install-xxxx'                  -- ex. proches testant « pour voir »
  --
  -- ⚠️ NE PAS exclure 'install-1784896946511-qob00bzw2d' : premier utilisateur
  -- RÉEL (iOS, TestFlight, 16/09/2026 à 10h13). C'est lui qui a clos le
  -- bloqueur tracking du 19/08 — app_open puis contribution_logged en 37 s.
)
-- Et on écarte les sessions de navigateur : l'app n'est distribuée QUE sur Play
-- (Alpha) et TestFlight, donc tout `platform = 'web'` est un Expo web, une preview
-- ou une démo — jamais un utilisateur. Exclure par plateforme plutôt qu'appareil
-- par appareil règle le passé ET l'avenir sans entretien. `is distinct from`
-- plutôt que `<>` pour garder les lignes dont la plateforme serait nulle.
and platform is distinct from 'web';

revoke all on events_reels from anon, authenticated;

--      ✅ 11/11/2026 : exécuté et VÉRIFIÉ par le comportement, pas par la définition.
--      Les 4 appareils ci-dessus ont 0 ligne dans la vue, et le premier utilisateur réel
--      (qob00bzw2d) en a bien 18. L'écart dépôt/base du 01/11 est refermé.
--
--      Le filtre `platform` a été ajouté le même jour, sur décision de Patrick. Ce qu'il
--      écarte n'était pas marginal — répartition de la vue AVANT :
--        web 32 installs / 239 lignes · android 31 / 160 · ios 28 / 73
--      Un tiers des « installs » comptées et la moitié des lignes venaient d'un navigateur.
--      Le plus gros contributeur de toute la table en était un : 'install-demo-delete12',
--      84 lignes, identifiant écrit à la main — et il était COMPTÉ. On excluait quatre
--      téléphones à la main pendant que 32 sessions de navigateur gonflaient le
--      dénominateur. APRÈS : android 31 / 160 · ios 28 / 73, soit 233 lignes sur 538.


-- 0.f  À VENIR : écarter les builds de test par leur drapeau, plus par leur id.
--      Depuis la 2.3.0, chaque événement porte `metadata->>'build'` (canal de
--      distribution : development / preview / preview-test / production / local)
--      et, uniquement sur un build de test, `metadata->>'test_build' = 'true'`.
--      Un appareil de test n'a donc plus besoin d'être inventorié à la main —
--      c'est ce qui avait fait vivre 4 exclusions dans le dépôt et 1 dans la base.
--
--      ⚠️ NE PAS l'ajouter à la vue tout de suite : les lignes antérieures à la
--      2.3.0 n'ont pas ces clés, et un filtre `= 'true'` les laisserait passer
--      tandis qu'un filtre mal écrit les supprimerait toutes. Quand la 2.3.0
--      aura remplacé le parc, ajouter à `events_reels` :
--        and (metadata->>'test_build') is distinct from 'true'
--
--      ⚠️ `preview` N'EST PAS un build de test : c'est l'APK reçu par les
--      personnes au Gabon que le VPN prive du Play Store (décision du 16/09,
--      elles comptent). Ne jamais filtrer sur `build <> 'production'`.
--
--      Voir d'où viennent les lignes récentes :
--   select metadata->>'build' as canal,
--          metadata->>'test_build' as test,
--          count(*) as lignes,
--          count(distinct install_id) as installs
--   from events
--   where created_at > now() - interval '30 days'
--   group by 1, 2 order by lignes desc;


-- 0.e  ⭐ FAIT LE 11/11/2026 : retirer à la clé publique les droits destructeurs.
--      La clé anon est dans le binaire de l'app, donc publique. Seul RLS empêchait la
--      casse — et RLS ne s'applique PAS à TRUNCATE, qui était accordé par défaut.
--
--   revoke update, delete, truncate on public.events from anon, authenticated;
--
--      Après coup, anon ne garde que INSERT, REFERENCES, SELECT, TRIGGER. SELECT est
--      conservé exprès (PostgREST en a besoin si un insert demande la ligne créée) et
--      reste neutralisé par RLS, qui n'a aucune politique SELECT.
--
--      Vérifier l'état des droits à tout moment :
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'events'
--     and grantee in ('anon','authenticated') order by grantee, privilege_type;


-- ############################################################################
-- SECTION 1 — SANTÉ / VOLUME (à lancer quand tu veux vérifier que ça vit)
-- ############################################################################

-- 1.a  Combien d'événements et de personnes distinctes, par type d'événement.
select event_type,
       count(*)                    as evenements,
       count(distinct install_id)  as personnes
from events
group by event_type
order by evenements desc;

-- 1.b  Première et dernière activité + nombre total de personnes distinctes.
select count(distinct install_id) as personnes_distinctes,
       min(created_at)            as premiere_activite,
       max(created_at)            as derniere_activite
from events;

-- 1.c  Répartition par plateforme (Android / iOS).
select platform,
       count(distinct install_id) as personnes
from events
group by platform
order by personnes desc;

-- 1.d  Répartition des installations par pays choisi dans MMG.
--      « legacy_inconnu » correspond aux événements V1, antérieurs au sélecteur V2.
with installations as (
  select distinct install_id
  from events_reels
  where event_type in ('app_open', 'goal_created')
),
premier_pays as (
  select distinct on (install_id)
         install_id,
         metadata->>'country' as country
  from events_reels
  where event_type in ('app_open', 'goal_created')
    and metadata->>'country' is not null
  order by install_id, created_at
)
select coalesce(p.country, 'legacy_inconnu') as country,
       count(*) as personnes
from installations i
left join premier_pays p on p.install_id = i.install_id
group by coalesce(p.country, 'legacy_inconnu')
order by personnes desc;


-- ############################################################################
-- SECTION 2 — ENTONNOIR D'ACTIVATION (combien franchissent chaque étape)
-- ############################################################################

-- 2.a  De l'ouverture au premier versement.
select
  count(distinct install_id) filter (where event_type = 'app_open')             as ont_ouvert_lapp,
  count(distinct install_id) filter (where event_type = 'goal_created')         as ont_cree_un_projet,
  count(distinct install_id) filter (where event_type = 'contribution_logged'
                                        and metadata->>'type' = 'deposit')       as ont_verse_au_moins_1x
from events_reels;


-- ############################################################################
-- SECTION 3 — RÉTENTION AU 3e RAPPEL  ★ LA MESURE PRINCIPALE ★
-- ############################################################################
--
--  Logique :
--   • « activation » = démarrage effectif le plus ancien choisi par chaque personne.
--     Pour un projet immédiat ou ancien, c'est sa création. Pour un démarrage différé,
--     on ajoute activationDelayDays à la création sans stocker la date choisie en clair.
--   • On ne compte que les personnes qui ont EU LE TEMPS d'atteindre le 3e rappel,
--     c.-à-d. activées il y a au moins 90 jours. (Sinon on sous-estime la rétention :
--     quelqu'un inscrit hier n'a pas encore pu revenir 3 fois.)
--   • « active au 3e rappel » = a fait au moins un VERSEMENT (dépôt) à partir du 90e jour
--     après son activation. Les retraits et les gestes de test ne comptent pas.
--
--  → Change le seuil « 90 days » si tu veux mesurer le 1er rappel (30) ou le 2e (60).

with activation as (
  select install_id,
         min(
           created_at + make_interval(
             days => coalesce((metadata->>'activationDelayDays')::integer, 0)
           )
         ) as activated_at
  from events_reels
  where event_type = 'goal_created'
  group by install_id
),
cohorte_eligible as (
  select install_id, activated_at
  from activation
  where activated_at <= now() - interval '90 days'
),
actifs_au_3e as (
  select distinct e.install_id
  from events_reels e
  join cohorte_eligible c on c.install_id = e.install_id
  where e.event_type = 'contribution_logged'
    and e.metadata->>'type' = 'deposit'
    and e.created_at >= c.activated_at + interval '90 days'
)
select
  (select count(*) from cohorte_eligible) as cohorte_ayant_eu_le_temps,
  (select count(*) from actifs_au_3e)     as encore_actifs_au_3e_rappel,
  round(100.0 * (select count(*) from actifs_au_3e)
        / nullif((select count(*) from cohorte_eligible), 0), 1) as retention_3e_rappel_pct;


-- 3.b  Même mesure, séparée par pays choisi lors du premier démarrage effectif.
--      C'est la vue à utiliser pour comparer la cohorte Gabon/FCFA à la cohorte France/EUR.
with projets as (
  select install_id,
         created_at,
         created_at + make_interval(
           days => coalesce((metadata->>'activationDelayDays')::integer, 0)
         ) as activated_at
  from events_reels
  where event_type = 'goal_created'
),
activation as (
  select distinct on (install_id)
         install_id,
         activated_at
  from projets
  order by install_id, activated_at, created_at
),
pays as (
  select distinct on (install_id)
         install_id,
         metadata->>'country' as country
  from events_reels
  where event_type in ('app_open', 'goal_created')
    and metadata->>'country' is not null
  order by install_id, created_at
),
cohorte_eligible as (
  select a.install_id,
         a.activated_at,
         coalesce(p.country, 'legacy_inconnu') as country
  from activation a
  left join pays p on p.install_id = a.install_id
  where a.activated_at <= now() - interval '90 days'
),
actifs_au_3e as (
  select distinct e.install_id
  from events_reels e
  join cohorte_eligible c on c.install_id = e.install_id
  where e.event_type = 'contribution_logged'
    and e.metadata->>'type' = 'deposit'
    and e.created_at >= c.activated_at + interval '90 days'
)
select c.country,
       count(*) as cohorte_ayant_eu_le_temps,
       count(a.install_id) as encore_actifs_au_3e_rappel,
       round(100.0 * count(a.install_id) / nullif(count(*), 0), 1) as retention_3e_rappel_pct
from cohorte_eligible c
left join actifs_au_3e a on a.install_id = c.install_id
group by c.country
order by cohorte_ayant_eu_le_temps desc;


-- 3.c  Même mesure séparée par mode du premier projet effectivement démarré.
--      Ne jamais agréger directement « guided » et « free » : une personne en
--      épargne libre peut être fidèle avec des versements irréguliers, sans suivre
--      exactement une mensualité. Les anciens événements sans clé restent guidés.
with projets as (
  select install_id,
         created_at,
         created_at + make_interval(
           days => coalesce((metadata->>'activationDelayDays')::integer, 0)
         ) as activated_at,
         coalesce(metadata->>'savingsMode', 'guided') as savings_mode
  from events_reels
  where event_type = 'goal_created'
),
activation as (
  select distinct on (install_id)
         install_id,
         activated_at,
         savings_mode
  from projets
  order by install_id, activated_at, created_at
),
cohorte_eligible as (
  select install_id, activated_at, savings_mode
  from activation
  where activated_at <= now() - interval '90 days'
),
actifs_au_3e as (
  select distinct e.install_id
  from events_reels e
  join cohorte_eligible c on c.install_id = e.install_id
  where e.event_type = 'contribution_logged'
    and e.metadata->>'type' = 'deposit'
    and e.created_at >= c.activated_at + interval '90 days'
)
select c.savings_mode,
       count(*) as cohorte_ayant_eu_le_temps,
       count(a.install_id) as encore_actifs_apres_90_jours,
       round(100.0 * count(a.install_id) / nullif(count(*), 0), 1) as retention_90_jours_pct
from cohorte_eligible c
left join actifs_au_3e a on a.install_id = c.install_id
group by c.savings_mode
order by cohorte_ayant_eu_le_temps desc;


-- ############################################################################
-- SECTION 4 — COURBE DE RÉTENTION DÉTAILLÉE (rappel par rappel)
-- ############################################################################
--
--  Pour chaque personne, on regarde en quel « mois » après son activation elle a
--  versé. rappel_no = nombre de tranches de 30 jours écoulées :
--    1 ≈ 1er rappel, 2 ≈ 2e, 3 ≈ 3e, etc.
--  Lecture : combien de personnes sont actives à chaque rappel successif.

with activation as (
  select install_id,
         min(
           created_at + make_interval(
             days => coalesce((metadata->>'activationDelayDays')::integer, 0)
           )
         ) as activated_at
  from events_reels
  where event_type = 'goal_created'
  group by install_id
),
versements as (
  select a.install_id,
         floor(extract(epoch from (e.created_at - a.activated_at)) / (30 * 24 * 3600))::int as rappel_no
  from activation a
  join events_reels e
    on e.install_id = a.install_id
   and e.event_type = 'contribution_logged'
   and e.metadata->>'type' = 'deposit'
  where e.created_at >= a.activated_at
)
select rappel_no,
       count(distinct install_id) as personnes_actives
from versements
where rappel_no between 0 and 6
group by rappel_no
order by rappel_no;


-- ############################################################################
-- SECTION 5 — ANALYSES QUALITATIVES (comprendre les abandons, brief §5 zone grise)
-- ############################################################################

-- 5.a  Popularité des catégories de projet à la création.
select metadata->>'category' as categorie,
       count(*)              as projets_crees
from events_reels
where event_type = 'goal_created'
group by categorie
order by projets_crees desc;

-- 5.b  Rythme choisi (stable / progressif / régressif).
select metadata->>'rhythm' as rythme,
       count(*)            as projets
from events_reels
where event_type = 'goal_created'
group by rythme
order by projets desc;

-- 5.c  Réaction aux propositions de réajustement (accepté / gardé / reporté).
select metadata->>'choice' as decision,
       count(*)            as occurrences
from events_reels
where event_type = 'rebalance_decided'
group by decision
order by occurrences desc;

-- 5.d  Combien de rappels sont ouverts vs reportés (santé du rituel).
select
  count(*) filter (where event_type = 'reminder_opened')    as rappels_ouverts,
  count(*) filter (where event_type = 'reminder_postponed') as rappels_reportes,
  count(*) filter (where event_type = 'goal_deleted')       as projets_supprimes
from events_reels;
