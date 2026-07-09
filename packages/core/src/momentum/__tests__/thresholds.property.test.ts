import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createMatchMomentumState, detectThresholdCrossing } from '../index';
import type { MatchMomentumState } from '../types';

const barArb = fc.float({ min: Math.fround(-5), max: Math.fround(5), noNaN: true });

function matchWithBars(homeBar: number, awayBar: number): MatchMomentumState {
	const base = createMatchMomentumState();
	return {
		home: { ...base.home, bar: homeBar },
		away: { ...base.away, bar: awayBar },
	};
}

describe('detectThresholdCrossing property tests', () => {
	it('is deterministic: same before/after/movedSide -> same effects', () => {
		fc.assert(
			fc.property(
				barArb,
				barArb,
				barArb,
				barArb,
				(homeBefore, awayBefore, homeAfter, awayAfter) => {
					const before = matchWithBars(homeBefore, awayBefore);
					const after = matchWithBars(homeAfter, awayAfter);
					const resultA = detectThresholdCrossing(before, after, 'home');
					const resultB = detectThresholdCrossing(before, after, 'home');
					expect(resultA).toEqual(resultB);
				},
			),
		);
	});

	it('enteredTheZone appears at most once per benefited side in any before/after pair', () => {
		fc.assert(
			fc.property(
				barArb,
				barArb,
				barArb,
				barArb,
				(homeBefore, awayBefore, homeAfter, awayAfter) => {
					const before = matchWithBars(homeBefore, awayBefore);
					const after = matchWithBars(homeAfter, awayAfter);
					const { effects } = detectThresholdCrossing(before, after, 'home');
					const zoneEffectsHome = effects.filter(
						(e) => e.type === 'enteredTheZone' && e.side === 'home',
					);
					const zoneEffectsAway = effects.filter(
						(e) => e.type === 'enteredTheZone' && e.side === 'away',
					);
					expect(zoneEffectsHome.length).toBeLessThanOrEqual(1);
					expect(zoneEffectsAway.length).toBeLessThanOrEqual(1);
				},
			),
		);
	});
});
