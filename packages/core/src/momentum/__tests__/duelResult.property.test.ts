import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { DuelSegment } from '../../duel';
import { applyDuelResult, createMomentumState } from '../index';

const segmentArb = fc.constantFrom<DuelSegment>(
	'crushingSuccess',
	'cleanSuccess',
	'forcedAdvance',
	'splitBall',
	'simpleLoss',
	'disadvantagedLoss',
	'devastatingCounter',
);

describe('applyDuelResult property tests', () => {
	it('bar stays within [-5, +5] for any arbitrary sequence of applyDuelResult', () => {
		fc.assert(
			fc.property(fc.array(segmentArb, { minLength: 0, maxLength: 50 }), (segments) => {
				let state = createMomentumState();
				for (const segment of segments) {
					state = applyDuelResult(state, segment);
				}
				expect(state.bar).toBeGreaterThanOrEqual(-5);
				expect(state.bar).toBeLessThanOrEqual(5);
			}),
		);
	});

	it('consecutiveWins is always >= 0', () => {
		fc.assert(
			fc.property(fc.array(segmentArb, { minLength: 0, maxLength: 50 }), (segments) => {
				let state = createMomentumState();
				for (const segment of segments) {
					state = applyDuelResult(state, segment);
					expect(state.consecutiveWins).toBeGreaterThanOrEqual(0);
				}
			}),
		);
	});

	it('determinism: same DuelSegment sequence yields the same bar', () => {
		fc.assert(
			fc.property(fc.array(segmentArb, { minLength: 0, maxLength: 50 }), (segments) => {
				let stateA = createMomentumState();
				let stateB = createMomentumState();
				for (const segment of segments) {
					stateA = applyDuelResult(stateA, segment);
					stateB = applyDuelResult(stateB, segment);
				}
				expect(stateA.bar).toBe(stateB.bar);
				expect(stateA.consecutiveWins).toBe(stateB.consecutiveWins);
			}),
		);
	});
});
