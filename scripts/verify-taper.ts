/**
 * Table-driven checks for the taper plan generator (spec §12).
 * Run: npx tsc scripts/verify-taper.ts src/lib/taperPlan.ts --module commonjs --target es2022 --outDir /tmp/taper-test && node /tmp/taper-test/scripts/verify-taper.js
 */
import assert from 'node:assert';

import {
  countLadder,
  generateWeeks,
  mgForTap,
  moneySaved,
  plannedMg,
  weekIndexFor,
  zeroDateKey,
} from '../src/lib/taperPlan';

// Count ladders (as built, v1.1)
assert.deepEqual(countLadder(12, 'standard'), [12, 10, 8, 6, 5, 4, 3, 2]);
assert.deepEqual(countLadder(5, 'standard'), [5, 4, 3, 2]);
assert.deepEqual(countLadder(20, 'standard'), [20, 16, 13, 10, 8, 6, 5, 4, 3, 2]);
assert.deepEqual(countLadder(1, 'standard'), [1]);
assert.deepEqual(countLadder(12, 'fast'), [12, 8, 5, 3, 2]);

// Monotonic, min 1, always converges for all inputs
for (const pace of ['gentle', 'standard', 'fast'] as const) {
  for (let n = 1; n <= 40; n++) {
    const ladder = countLadder(n, pace);
    for (let i = 1; i < ladder.length; i++) {
      assert.ok((ladder[i] ?? 0) < (ladder[i - 1] ?? 0), `not decreasing: ${ladder}`);
    }
    assert.ok((ladder[ladder.length - 1] ?? 0) >= 1);
  }
}

// Full plan: 12 x 6mg standard = 8 count weeks + 2 strength weeks
const weeks = generateWeeks(12, 6, 'standard');
assert.equal(weeks.length, 10);
assert.deepEqual(weeks[8]?.mgPlan, [
  { mg: 6, count: 1 },
  { mg: 3, count: 1 },
]);
assert.deepEqual(weeks[9]?.mgPlan, [{ mg: 3, count: 2 }]);
assert.equal(plannedMg(weeks[0]!), 72);
assert.equal(plannedMg(weeks[9]!), 6);

// Strength sequences
assert.equal(generateWeeks(5, 8, 'standard').length, 4 + 4); // 8->6 mixed/full, 6->3 mixed/full
assert.equal(generateWeeks(5, 3, 'standard').length, 4 + 2); // 3->1.5 mixed/full
assert.equal(generateWeeks(5, 1.5, 'standard').length, 4); // no strength phase

// mgForTap: mixed week alternates high then low; over-limit taps use lowest
const mixed = weeks[8]!;
assert.equal(mgForTap(mixed, 0), 6);
assert.equal(mgForTap(mixed, 1), 3);
assert.equal(mgForTap(mixed, 5), 3);

// Dates
assert.equal(zeroDateKey('2026-11-16', weeks), '2027-01-25');
assert.equal(weekIndexFor('2026-11-16', '2026-11-16'), 0);
assert.equal(weekIndexFor('2026-11-16', '2026-11-23'), 1);
assert.equal(weekIndexFor('2026-11-16', '2026-11-22'), 0);

// Hold shifts Zero Day by exactly 7 (one extra week inserted)
const held = [...weeks.slice(0, 3), { ...weeks[2]!, held: true }, ...weeks.slice(3)];
assert.equal(zeroDateKey('2026-11-16', held), '2027-02-01');

// Money saved: 12/day -> 6/day for 7 days, 15/can, $6 -> $16.80
const usage: Record<string, { count: number; mgTotal: number }> = {};
for (let i = 0; i < 7; i++) usage[`2026-11-${16 + i}`] = { count: 6, mgTotal: 36 };
const saved = moneySaved(usage, 12, 15, 6);
assert.ok(saved !== null && Math.abs(saved - 16.8) < 0.001, `saved=${saved}`);
assert.equal(moneySaved(usage, 12, 15, null), null);

console.log('verify-taper: all assertions passed');
console.log('standard 12x6 plan:', weeks.map((w) => `${w.limit}@${plannedMg(w)}mg`).join(' -> '), '-> 0');
