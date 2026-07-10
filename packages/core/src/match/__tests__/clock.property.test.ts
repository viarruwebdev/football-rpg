import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { advanceClock, computeStoppageTime } from '../clock';
import type { MatchClock, MatchPhase, TimeConsumingAction } from '../types';

const allActions: TimeConsumingAction[] = [
	'normalDuel',
	'splitBall',
	'foulPlusFreeKick',
	'corner',
	'penalty',
	'substitution',
	'laneChange',
	'safePass',
	'sterilePossession',
	'shot',
];

const arbAction = fc.constantFrom(...allActions);

function makeClock(phase: MatchPhase = 'firstHalf'): MatchClock {
	return {
		playsElapsed: 0,
		phase,
		halfLength: 30,
		exactStoppageTime: 4,
		stoppageTimeVisibility: { kind: 'range', min: 4, max: 6 },
		stoppageContributions: [],
	};
}

const PHASE_ORDER: Record<MatchPhase, number> = { firstHalf: 0, secondHalf: 1, stoppage: 2 };

describe('clock CE-015 property: monotonicity', () => {
	it('playsElapsed never decreases within a phase, phase only advances', () => {
		fc.assert(
			fc.property(fc.array(arbAction, { minLength: 1, maxLength: 100 }), (actions) => {
				let clock = makeClock();
				let prevPhaseOrder = 0;
				for (const action of actions) {
					const next = advanceClock(clock, action);
					if (next.phase === clock.phase) {
						expect(next.playsElapsed).toBeGreaterThanOrEqual(clock.playsElapsed);
					}
					expect(PHASE_ORDER[next.phase]).toBeGreaterThanOrEqual(prevPhaseOrder);
					prevPhaseOrder = PHASE_ORDER[next.phase];
					clock = next;
				}
			}),
		);
	});

	it('phase only transitions in order firstHalf→secondHalf→stoppage', () => {
		fc.assert(
			fc.property(fc.array(arbAction, { minLength: 1, maxLength: 200 }), (actions) => {
				let clock = makeClock();
				for (const action of actions) {
					const next = advanceClock(clock, action);
					expect(PHASE_ORDER[next.phase]).toBeGreaterThanOrEqual(
						PHASE_ORDER[clock.phase],
					);
					clock = next;
				}
			}),
		);
	});

	it('exactStoppageTime >= 4 for minimum base with no contributions', () => {
		expect(computeStoppageTime(4, [])).toBeGreaterThanOrEqual(4);
	});
});
