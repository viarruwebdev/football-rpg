import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyEvent, computeMomentumModifier, createMomentumState } from '../index';
import type { MomentumEventCause } from '../types';

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

describe('applyEvent property tests', () => {
	it('bar stays within [-5, +5] for any arbitrary sequence of applyEvent', () => {
		fc.assert(
			fc.property(fc.array(causeArb, { minLength: 0, maxLength: 50 }), (causes) => {
				let state = createMomentumState();
				for (const cause of causes) {
					state = applyEvent(state, cause);
				}
				expect(state.bar).toBeGreaterThanOrEqual(-5);
				expect(state.bar).toBeLessThanOrEqual(5);
			}),
		);
	});

	it('maxReached never decreases across any sequence', () => {
		fc.assert(
			fc.property(fc.array(causeArb, { minLength: 0, maxLength: 50 }), (causes) => {
				let state = createMomentumState();
				let previousMax = state.maxReached;
				for (const cause of causes) {
					state = applyEvent(state, cause);
					expect(state.maxReached).toBeGreaterThanOrEqual(previousMax);
					previousMax = state.maxReached;
				}
			}),
		);
	});

	it('computeMomentumModifier(bar) is always within [-0.75, +0.75] after any sequence', () => {
		fc.assert(
			fc.property(fc.array(causeArb, { minLength: 0, maxLength: 50 }), (causes) => {
				let state = createMomentumState();
				for (const cause of causes) {
					state = applyEvent(state, cause);
				}
				const modifier = computeMomentumModifier(state.bar);
				expect(modifier).toBeGreaterThanOrEqual(-0.75);
				expect(modifier).toBeLessThanOrEqual(0.75);
			}),
		);
	});
});
