import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { DuelSegment } from '../../duel';
import {
	applyDuelResult,
	applyEvent,
	createMatchMomentumState,
	degradeAndDetect,
	updateMomentum,
} from '../index';
import type { MatchMomentumState, MomentumEventCause, MomentumSide } from '../types';

type Step =
	| { kind: 'event'; side: MomentumSide; cause: MomentumEventCause }
	| { kind: 'duel'; side: MomentumSide; segment: DuelSegment }
	| {
			kind: 'degrade';
			side: MomentumSide;
			hadSignificantEventOrWin: boolean;
			determinationAverage: number;
	  };

const sideArb = fc.constantFrom<MomentumSide>('home', 'away');
const causeArb = fc.constantFrom<MomentumEventCause>(
	'goal',
	'tideTurningGoal',
	'specialTechniqueSuccess',
	'epicSave',
	'oneOnOneSave',
	'pressingSteal',
	'possessionStreak',
	'greatSave',
);
const segmentArb = fc.constantFrom<DuelSegment>(
	'crushingSuccess',
	'cleanSuccess',
	'forcedAdvance',
	'splitBall',
	'simpleLoss',
	'disadvantagedLoss',
	'devastatingCounter',
);

const stepArb: fc.Arbitrary<Step> = fc.oneof(
	fc.record({ kind: fc.constant('event' as const), side: sideArb, cause: causeArb }),
	fc.record({ kind: fc.constant('duel' as const), side: sideArb, segment: segmentArb }),
	fc.record({
		kind: fc.constant('degrade' as const),
		side: sideArb,
		hadSignificantEventOrWin: fc.boolean(),
		determinationAverage: fc.integer({ min: 1, max: 20 }),
	}),
);

function runSequence(steps: Step[]): MatchMomentumState {
	let match = createMatchMomentumState();
	for (const step of steps) {
		if (step.kind === 'event') {
			const barState = applyEvent(match[step.side], step.cause);
			match = updateMomentum(match, step.side, barState).match;
		} else if (step.kind === 'duel') {
			const barState = applyDuelResult(match[step.side], step.segment);
			match = updateMomentum(match, step.side, barState).match;
		} else {
			match = degradeAndDetect(match, step.side, {
				hadSignificantEventOrWin: step.hadSignificantEventOrWin,
				determinationAverage: step.determinationAverage,
			}).match;
		}
	}
	return match;
}

describe('determinism across the full momentum pipeline (CE-001)', () => {
	it('same mixed sequence of applyEvent/applyDuelResult/degradeMomentum/updateMomentum produces the same MatchMomentumState twice', () => {
		fc.assert(
			fc.property(fc.array(stepArb, { minLength: 0, maxLength: 40 }), (steps) => {
				const resultA = runSequence(steps);
				const resultB = runSequence(steps);
				expect(resultA.home.bar).toBe(resultB.home.bar);
				expect(resultA.away.bar).toBe(resultB.away.bar);
				expect(resultA.home.consecutiveWins).toBe(resultB.home.consecutiveWins);
				expect(resultA.away.consecutiveWins).toBe(resultB.away.consecutiveWins);
				expect([...resultA.home.crossedThresholds]).toEqual([
					...resultB.home.crossedThresholds,
				]);
				expect([...resultA.away.crossedThresholds]).toEqual([
					...resultB.away.crossedThresholds,
				]);
				expect(resultA.home.playerInTheZone).toEqual(resultB.home.playerInTheZone);
				expect(resultA.away.playerInTheZone).toEqual(resultB.away.playerInTheZone);
			}),
		);
	});
});
