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
--    reminder_postponed, balance_confirmed, rebalance_decided, goal_deleted.
--  Colonnes utiles : install_id (qui), event_type (quoi), created_at (quand),
--    platform, app_version, metadata (détails en JSON).
--  Clés metadata connues :
--    goal_created         → category, rhythm
--    contribution_logged  → type ('deposit'/'withdrawal'), amountBucket, source
--    rebalance_decided    → choice ('applied'/'kept'/'deferred')
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


-- 0.b  ENTRETIEN RGPD : purge trimestrielle des événements de plus de 12 mois.
--      La page Confidentialité annonce une conservation de 12 mois maximum.
--      Rien ne le fait automatiquement : lance ceci ~1 fois par trimestre.
--
--   delete from events where created_at < now() - interval '12 months';


-- 0.c  ⭐ À LANCER UNE FOIS : la vue « events_reels » (sans tes appareils de test).
--      Chaque INSTALLATION a son propre install_id (ton Android et un simulateur
--      iPhone = deux identifiants différents). Toi, tu ouvres l'app en permanence :
--      si tu restes dans la mesure, tu gonfles artificiellement la rétention.
--      Cette vue écarte tes installations une bonne fois pour toutes ; toutes les
--      requêtes de mesure ci-dessous l'utilisent à la place de « events ».
--
--      Pour ajouter un appareil à exclure plus tard : relance ce bloc en ajoutant
--      son install_id à la liste (garde la virgule entre chaque).

create or replace view events_reels as
select *
from events
where install_id not in (
  'install-1784788834062-uklf43hsnw'   -- Patrick — téléphone Android
  -- , 'install-xxxx'                  -- ex. simulateur iPhone, proches testant « pour voir »
);


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
--   • « activation » = date du 1er projet créé par chaque personne (son point de départ).
--   • On ne compte que les personnes qui ont EU LE TEMPS d'atteindre le 3e rappel,
--     c.-à-d. activées il y a au moins 90 jours. (Sinon on sous-estime la rétention :
--     quelqu'un inscrit hier n'a pas encore pu revenir 3 fois.)
--   • « active au 3e rappel » = a fait au moins un VERSEMENT (dépôt) à partir du 90e jour
--     après son activation. Les retraits et les gestes de test ne comptent pas.
--
--  → Change le seuil « 90 days » si tu veux mesurer le 1er rappel (30) ou le 2e (60).

with activation as (
  select install_id, min(created_at) as activated_at
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


-- ############################################################################
-- SECTION 4 — COURBE DE RÉTENTION DÉTAILLÉE (rappel par rappel)
-- ############################################################################
--
--  Pour chaque personne, on regarde en quel « mois » après son activation elle a
--  versé. rappel_no = nombre de tranches de 30 jours écoulées :
--    1 ≈ 1er rappel, 2 ≈ 2e, 3 ≈ 3e, etc.
--  Lecture : combien de personnes sont actives à chaque rappel successif.

with activation as (
  select install_id, min(created_at) as activated_at
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
