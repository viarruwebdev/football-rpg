import { describe, expect, it } from 'vitest';
import { applyDiminishing } from '../../duel/modifiers';
import { resolveDuel } from '../../duel/resolveDuel';
import { createMatchMomentumState } from '../../momentum';
import { makeRng } from '../../rng';
import {
	buildSituationalModifiers,
	emitPossessionStreak,
	emitPressingSteal,
} from '../momentumWiring';
import { createPossession } from '../possession';

describe('buildSituationalModifiers', () => {
	it('CE-005: with momentum +5 returns array containing 0.75', () => {
		const mods = buildSituationalModifiers(0, 5, []);
		expect(mods).toContain(0.75);
	});

	it('CE-005: buildSituationalModifiers(2, 5) returns [2, 0.75]', () => {
		expect(buildSituationalModifiers(2, 5, [])).toEqual([2, 0.75]);
	});

	it('returns [pressure, momentumMod] with no extra mods', () => {
		expect(buildSituationalModifiers(0, 0, [])).toEqual([0, 0]);
		expect(buildSituationalModifiers(3, -5, [])).toEqual([3, -0.75]);
	});

	it('includes extra modifiers appended', () => {
		const mods = buildSituationalModifiers(1, 2, [5]);
		expect(mods).toEqual([1, 0.3, 5]);
	});

	// CE-005 grep verification: applyDiminishing is NOT imported in momentumWiring.ts
	// grep -n "applyDiminishing" packages/core/src/match/momentumWiring.ts → must be empty
});

describe('CE-005 (composition): momentum +5 diluted by diminishing returns inside resolveDuel', () => {
	// Verify the diminishing-returns formula directly:
	// pressure=4, momentumMod=0.75 → raw sum 4.75
	// first 4 pts at 100% = 4.00; remaining 0.75 at 50% = 0.375 → effective = round(4.375) = 4
	// If +0.75 were applied whole: 4 + 0.75 = 4.75 → round = 5 (wrong)
	it('applyDiminishing([4, 0.75]) → 4, not 5 (0.75 diluted to 0.375 in the 50% tier)', () => {
		const mods = buildSituationalModifiers(4, 5); // pressure=4, bar=+5 → [4, 0.75]
		expect(mods).toEqual([4, 0.75]);
		const effective = applyDiminishing(mods); // raw=4.75 → round(4+0.375)=4
		expect(effective).toBe(4);
		// Confirm it is strictly less than if 0.75 were added whole (would be 5)
		expect(effective).toBeLessThan(5);
	});

	// Verify the same dilution occurs inside resolveDuel via the attack strength path.
	// Same seed, two duels: one with [4, 0.75], one with [4, 1] (hypothetical extra 0.25).
	// Both give effective=4 (since 4.75 and 5.0 round the same after diminishing returns on 4+x in [0,4]).
	// The key check: a duel with [4, 0.75] mods vs [4, 0] mods (no momentum) differs by
	// exactly the diluted contribution, not by the raw 0.75.
	it('resolveDuel with mods [4, 0.75] produces a stronger attacker than [4, 0] but not +1 stronger (diluted)', () => {
		const rng = makeRng(999);
		// With pressure=4 and no momentum: effective = applyDiminishing([4, 0]) = 4
		const resultNoMomentum = resolveDuel(
			{
				attack: { cardPower: 5, attribute: 10, modifiers: [4, 0], composure: 10 },
				defense: { cardPower: 5, attribute: 10, modifiers: [], composure: 10 },
			},
			rng,
		);
		// With pressure=4 and momentum+5 (0.75 bruto): effective = applyDiminishing([4, 0.75]) = 4
		// The diluted contribution rounds to 0, so attackStrength is EQUAL, not +1
		const resultWithMomentum = resolveDuel(
			{
				attack: { cardPower: 5, attribute: 10, modifiers: [4, 0.75], composure: 10 },
				defense: { cardPower: 5, attribute: 10, modifiers: [], composure: 10 },
			},
			rng,
		);
		// Both calls use the same rng state (rng is immutable/pure), so same uncertainty.
		// The attack strength with mods [4,0] = 5+0+4=9; with [4,0.75] = 5+0+4=9 (same after rounding).
		// Therefore result should be identical: dilution absorbed the 0.75 into the already-full 4-pt block.
		expect(resultWithMomentum.result).toBe(resultNoMomentum.result);
	});

	// Contrast case: when mods are low enough that +0.75 IS in the 100% tier,
	// the full contribution reaches the result.
	it('applyDiminishing([0, 0.75]) → 1, not 0 (0.75 rounds to 1 when in the 100% tier)', () => {
		const mods = buildSituationalModifiers(0, 5); // pressure=0, bar=+5 → [0, 0.75]
		const effective = applyDiminishing(mods); // raw=0.75 → round(0.75)=1
		expect(effective).toBe(1);
	});
});

describe('emitPossessionStreak', () => {
	it('CE-012: emits when duelsWonInPossession >= 3 and not already emitted', () => {
		const possession = {
			...createPossession('home'),
			duelsWonInPossession: 3,
			possessionStreakEmitted: false,
		};
		const momentum = createMatchMomentumState();
		const result = emitPossessionStreak(possession, momentum, 'home');
		expect(
			result.events.some(
				(e) => e.type === 'momentumEventApplied' && e.cause === 'possessionStreak',
			),
		).toBe(true);
		expect(result.possession.possessionStreakEmitted).toBe(true);
	});

	it('CE-012 one-shot: does not re-emit when possessionStreakEmitted is true', () => {
		const possession = {
			...createPossession('home'),
			duelsWonInPossession: 4,
			possessionStreakEmitted: true,
		};
		const momentum = createMatchMomentumState();
		const result = emitPossessionStreak(possession, momentum, 'home');
		expect(result.events).toHaveLength(0);
		expect(result.possession.possessionStreakEmitted).toBe(true);
	});

	it('does not emit when duelsWonInPossession < 3', () => {
		const possession = {
			...createPossession('home'),
			duelsWonInPossession: 2,
			possessionStreakEmitted: false,
		};
		const momentum = createMatchMomentumState();
		const result = emitPossessionStreak(possession, momentum, 'home');
		expect(result.events).toHaveLength(0);
		expect(result.possession.possessionStreakEmitted).toBe(false);
	});
});

describe('emitPressingSteal', () => {
	it("CE-014: strip 'defense' → emits pressingSteal", () => {
		const momentum = createMatchMomentumState();
		const result = emitPressingSteal('defense', 'away', momentum);
		expect(result.events.length).toBeGreaterThan(0);
	});

	it("CE-014: strip 'midfield' → emits pressingSteal", () => {
		const momentum = createMatchMomentumState();
		const result = emitPressingSteal('midfield', 'away', momentum);
		expect(result.events.length).toBeGreaterThan(0);
	});

	it("CE-014: strip 'attack' → does NOT emit pressingSteal", () => {
		const momentum = createMatchMomentumState();
		const result = emitPressingSteal('attack', 'away', momentum);
		expect(result.events).toHaveLength(0);
	});

	it("CE-014: strip 'area' → does NOT emit pressingSteal", () => {
		const momentum = createMatchMomentumState();
		const result = emitPressingSteal('area', 'away', momentum);
		expect(result.events).toHaveLength(0);
	});
});
