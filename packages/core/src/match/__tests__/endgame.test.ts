import { describe, expect, it } from 'vitest';
import { createMatchMomentumState } from '../../momentum';
import { makeRng } from '../../rng';
import { handleClockExpiry } from '../endgame';
import { createPossession } from '../possession';
import type { MatchClock, MatchState } from '../types';

function makeStoppage(playsElapsed: number, exactStoppageTime: number): MatchClock {
	return {
		playsElapsed,
		phase: 'stoppage',
		halfLength: 30,
		exactStoppageTime,
		stoppageTimeVisibility: {
			kind: 'range',
			min: exactStoppageTime,
			max: exactStoppageTime + 2,
		},
		stoppageContributions: [],
	};
}

function makeState(
	score: { home: number; away: number },
	clockOverrides?: Partial<MatchClock>,
): MatchState {
	const clock = { ...makeStoppage(5, 4), ...clockOverrides };
	return {
		clock,
		possession: createPossession('home'),
		momentum: createMatchMomentumState(),
		score,
		rng: makeRng(42),
	};
}

describe('handleClockExpiry', () => {
	it('RF-012: clock expired with no lastGasp condition returns unchanged state and no events', () => {
		// home is attacking and NOT losing (0-0) → no lastGasp is granted, state passes through unchanged.
		const state = makeState({ home: 0, away: 0 });
		const { state: next, events } = handleClockExpiry(state);
		expect(next).toEqual(state);
		expect(events).toHaveLength(0);
	});

	it('RF-013: attacking team losing by 1 at clock expiry receives lastGasp event', () => {
		// home is attacking and losing 0-1
		const state = makeState({ home: 0, away: 1 });
		const { events } = handleClockExpiry(state);
		const gasp = events.find((e) => e.type === 'lastGasp');
		expect(gasp).toBeDefined();
		if (gasp && gasp.type === 'lastGasp') {
			expect(gasp.side).toBe('home');
		}
	});

	it('RF-013 inverse: attacking team winning → no lastGasp', () => {
		const state = makeState({ home: 2, away: 0 });
		const { events } = handleClockExpiry(state);
		expect(events.find((e) => e.type === 'lastGasp')).toBeUndefined();
	});

	it('RF-013 inverse: attacking team drawing → no lastGasp', () => {
		const state = makeState({ home: 1, away: 1 });
		const { events } = handleClockExpiry(state);
		expect(events.find((e) => e.type === 'lastGasp')).toBeUndefined();
	});

	it('RF-013: lastGasp is granted exactly once — never a second one', () => {
		const state = makeState({ home: 0, away: 1 });
		const { state: next1 } = handleClockExpiry(state);
		// Running handleClockExpiry again on a state where lastGasp was already given
		// should not grant another one (the state should reflect this)
		const { events: events2 } = handleClockExpiry(next1);
		expect(events2.filter((e) => e.type === 'lastGasp')).toHaveLength(0);
	});
});
