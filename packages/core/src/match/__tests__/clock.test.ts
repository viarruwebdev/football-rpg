import { describe, expect, it } from 'vitest';
import { advanceClock, computeStoppageTime } from '../clock';
import type { MatchClock, TimeConsumingAction } from '../types';

function makeClock(overrides: Partial<MatchClock> = {}): MatchClock {
	return {
		playsElapsed: 0,
		phase: 'firstHalf',
		halfLength: 30,
		exactStoppageTime: 4,
		stoppageTimeVisibility: { kind: 'range', min: 4, max: 6 },
		stoppageContributions: [],
		...overrides,
	};
}

describe('advanceClock', () => {
	it('CE-002: 30 normalDuel plays trigger firstHalf→secondHalf transition', () => {
		let clock = makeClock();
		for (let i = 0; i < 30; i++) {
			clock = advanceClock(clock, 'normalDuel');
		}
		expect(clock.phase).toBe('secondHalf');
		expect(clock.playsElapsed).toBe(0);
	});

	it('CE-002: 30 more normalDuel plays trigger secondHalf→stoppage transition', () => {
		let clock = makeClock({ phase: 'secondHalf' });
		for (let i = 0; i < 30; i++) {
			clock = advanceClock(clock, 'normalDuel');
		}
		expect(clock.phase).toBe('stoppage');
		expect(clock.playsElapsed).toBe(0);
	});

	it('RF-002: splitBall advances 2 plays total', () => {
		const clock = makeClock();
		const next = advanceClock(clock, 'splitBall');
		expect(next.playsElapsed).toBe(2);
	});

	it('RF-004: stoppageTimeVisibility changes from range to exact when 2 plays remain', () => {
		const stoppage = 4;
		let clock = makeClock({ phase: 'stoppage', exactStoppageTime: stoppage });
		clock = advanceClock(clock, 'normalDuel'); // 1 played, 3 remain → range
		expect(clock.stoppageTimeVisibility.kind).toBe('range');
		clock = advanceClock(clock, 'normalDuel'); // 2 played, 2 remain → exact
		expect(clock.stoppageTimeVisibility.kind).toBe('exact');
		if (clock.stoppageTimeVisibility.kind === 'exact') {
			expect(clock.stoppageTimeVisibility.value).toBe(stoppage);
		}
	});

	it('does not allow phase to go backwards', () => {
		const clock = makeClock({ phase: 'secondHalf' });
		const next = advanceClock(clock, 'normalDuel');
		expect(['secondHalf', 'stoppage']).toContain(next.phase);
	});

	it.each<[TimeConsumingAction, number]>([
		['normalDuel', 1],
		['foulPlusFreeKick', 1],
		['shot', 1],
		['substitution', 1],
		['laneChange', 1],
		['safePass', 1],
		['corner', 2],
		['penalty', 2],
		['sterilePossession', 2],
		['splitBall', 2],
	])('RF-002 table: %s consumes %i play(s)', (action, expected) => {
		const clock = makeClock();
		const next = advanceClock(clock, action);
		expect(next.playsElapsed).toBe(expected);
	});
});

// NOTE: these tests exercise `computeStoppageTime` in isolation. They do NOT
// cover the /analyze C1 finding ("partido con N faltas → exactStoppageTime ==
// base + 0.5·N"), which asked for an INTEGRATION test through `playMatch`.
// `playMatch` never calls `computeStoppageTime` (faults/injuries/substitutions
// are out of scope for the 004 — see spec.md CE-003), so no such integration
// exists yet. See playMatch.golden.test.ts for the test that pins this gap.
describe('computeStoppageTime', () => {
	it('CE-003: same contributions + same base → same exactStoppageTime', () => {
		const contributions = [{ kind: 'foul' as const }, { kind: 'injury' as const }];
		const a = computeStoppageTime(4, contributions);
		const b = computeStoppageTime(4, contributions);
		expect(a).toBe(b);
	});

	it('base 4, 2 fouls, 1 injury, 1 substitution → 6.5 (unit, not integrated into playMatch)', () => {
		const contributions = [
			{ kind: 'foul' as const },
			{ kind: 'foul' as const },
			{ kind: 'injury' as const },
			{ kind: 'substitution' as const },
		];
		expect(computeStoppageTime(4, contributions)).toBe(6.5);
	});

	it('double foul effect: foul adds 0.5 to stoppage time (unit, not integrated into playMatch)', () => {
		const withFoul = computeStoppageTime(4, [{ kind: 'foul' }]);
		expect(withFoul).toBe(4.5);
	});

	it('no contributions returns base', () => {
		expect(computeStoppageTime(5, [])).toBe(5);
	});
});
