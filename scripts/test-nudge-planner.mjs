import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/nudge-planner.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', compiled)(loaded.exports, loaded);

const { planNudges, NUDGE_CAP_DAYS, NUDGE_INACTIVITY_DAYS, NUDGE_MAX_INACTIVITY } = loaded.exports;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 11, 9, 0, 0); // 2026-08-11 09:00 UTC
const days = (n) => NOW + n * DAY;
const mids = (out) => out.filter((n) => n.trigger === 'mid_cycle');

// Projet « sain » : activé, non atteint, actif depuis longtemps, touché récemment,
// avec un point mi-cycle loin du rappel. Surcharge au besoin.
const goal = (over = {}) => ({
  goalId: 'g1',
  nudgeEnabled: true,
  reached: false,
  activationAt: days(-100),
  lastTouchedAt: days(-2),
  midCycleNudges: [{ at: days(6), reminderAt: days(20), settled: false }],
  ...over,
});

// Config par défaut : app ouverte à l'instant, aucun coup de pouce récent.
// (L'inactivité reste ARMÉE à « dernière ouverture + N jours » : elle ne
//  partira que si l'utilisateur cesse d'ouvrir l'app.)
const cfg = (over = {}) => ({ now: NOW, lastAppOpenAt: NOW, lastNudgeAt: 0, ...over });

// 1. Aucun projet → rien.
assert.deepEqual(planNudges([], cfg()), []);

// 2. Cas nominal : le mi-cycle valide est bien programmé, en tête.
{
  const out = planNudges([goal()], cfg());
  assert.equal(out[0].trigger, 'mid_cycle');
  assert.equal(out[0].at, days(6));
  assert.equal(mids(out).length, 1);
}

// 3. Mi-cycle trop près du rappel (< 4 j) → aucun mi-cycle.
assert.equal(
  mids(planNudges([goal({ midCycleNudges: [{ at: days(18), reminderAt: days(20), settled: false }] })], cfg())).length,
  0
);

// 4. Projet atteint → rien du tout (ni A ni B : projet non éligible).
assert.deepEqual(planNudges([goal({ reached: true })], cfg({ lastAppOpenAt: days(-30) })), []);

// 5. Coup de pouce désactivé → rien du tout (pas d'inactivité non plus).
assert.deepEqual(planNudges([goal({ nudgeEnabled: false })], cfg({ lastAppOpenAt: days(-30) })), []);

// 6. Mi-cycle avant l'activation (démarrage différé) → aucun mi-cycle.
assert.equal(mids(planNudges([goal({ activationAt: days(10) })], cfg())).length, 0);

// 7. Cycle déjà soldé → aucun mi-cycle pour ce cycle.
assert.equal(
  mids(planNudges([goal({ midCycleNudges: [{ at: days(6), reminderAt: days(20), settled: true }] })], cfg())).length,
  0
);

// 8. Plafond : deux mi-cycles à 5 jours d'écart → le second (b) est écarté.
{
  const out = planNudges(
    [
      goal({ goalId: 'a', midCycleNudges: [{ at: days(6), reminderAt: days(20), settled: false }] }),
      goal({ goalId: 'b', midCycleNudges: [{ at: days(11), reminderAt: days(25), settled: false }] }),
    ],
    cfg()
  );
  assert.equal(out[0].goalId, 'a');
  assert.equal(out[0].trigger, 'mid_cycle');
  assert.ok(!out.some((n) => n.goalId === 'b'), 'le second mi-cycle est plafonné');
}

// 8b. Deux mi-cycles espacés de plus d'une quinzaine → les deux passent.
{
  const out = planNudges(
    [
      goal({ goalId: 'a', midCycleNudges: [{ at: days(6), reminderAt: days(20), settled: false }] }),
      goal({ goalId: 'b', midCycleNudges: [{ at: days(6 + NUDGE_CAP_DAYS), reminderAt: days(40), settled: false }] }),
    ],
    cfg()
  );
  assert.ok(out.some((n) => n.goalId === 'a' && n.trigger === 'mid_cycle'));
  assert.ok(out.some((n) => n.goalId === 'b' && n.trigger === 'mid_cycle'));
}

// 9. Plafond amorcé par lastNudgeAt : mi-cycle trop proche d'un précédent → écarté.
// days(6) - days(-2) = 8 j < 15 → pas de mi-cycle.
assert.equal(mids(planNudges([goal()], cfg({ lastNudgeAt: days(-2) }))).length, 0);

// 10. Inactivité : app non ouverte depuis longtemps → coups de pouce d'inactivité,
//     espacés du plafond, limités à NUDGE_MAX_INACTIVITY, aucun mi-cycle ici.
{
  const out = planNudges(
    [goal({ midCycleNudges: [] })],
    cfg({ lastAppOpenAt: days(-NUDGE_INACTIVITY_DAYS - 1) })
  );
  assert.ok(out.length >= 1 && out.length <= NUDGE_MAX_INACTIVITY);
  assert.ok(out.every((n) => n.trigger === 'inactivity'));
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i].at - out[i - 1].at >= NUDGE_CAP_DAYS * DAY, 'inactivité espacée du plafond');
  }
}

// 11. Inactivité seulement si un projet a le coup de pouce activé → sinon rien.
assert.deepEqual(
  planNudges([goal({ nudgeEnabled: false, midCycleNudges: [] })], cfg({ lastAppOpenAt: days(-60) })),
  []
);

// 12. Cible de l'inactivité = projet le plus anciennement touché.
{
  const out = planNudges(
    [
      goal({ goalId: 'recent', lastTouchedAt: days(-1), midCycleNudges: [] }),
      goal({ goalId: 'neglige', lastTouchedAt: days(-40), midCycleNudges: [] }),
    ],
    cfg({ lastAppOpenAt: days(-30) })
  );
  assert.ok(out.length >= 1);
  assert.ok(out.every((n) => n.goalId === 'neglige' && n.trigger === 'inactivity'));
}

// 13. Départage à instant égal : projet le plus anciennement touché retenu (via plafond).
{
  const out = planNudges(
    [
      goal({ goalId: 'recent', lastTouchedAt: days(-1) }),
      goal({ goalId: 'neglige', lastTouchedAt: days(-40) }),
    ],
    cfg()
  );
  assert.equal(out[0].goalId, 'neglige');
  assert.equal(out[0].trigger, 'mid_cycle');
  assert.ok(!out.some((n) => n.goalId === 'recent'), 'le mi-cycle du projet récent est plafonné');
}

// 14. Le plafond couple A et B : jamais deux coups de pouce à moins d'une quinzaine.
{
  const out = planNudges([goal()], cfg({ lastAppOpenAt: days(-NUDGE_INACTIVITY_DAYS) }));
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i].at - out[i - 1].at >= NUDGE_CAP_DAYS * DAY);
  }
}

// 15. Horizon : un mi-cycle au-delà de l'horizon est ignoré.
assert.equal(
  mids(planNudges([goal({ midCycleNudges: [{ at: days(200), reminderAt: days(214), settled: false }] })], cfg({ horizonDays: 90 }))).length,
  0
);

console.log('Tests planificateur : plafond partagé, priorité, inactivité, cas « ne rien envoyer » validés.');
