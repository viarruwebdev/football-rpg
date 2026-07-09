import { describe, expect, it } from 'vitest';
import {
	applyEvent,
	createMatchMomentumState,
	createMomentumState,
	degradeAndDetect,
	degradeMomentum,
	updateMomentum,
} from '../index';
import type { DegradationContext } from '../types';

function context(overrides: Partial<DegradationContext> = {}): DegradationContext {
	return { hadSignificantEventOrWin: false, determinationAverage: 10, ...overrides };
}

describe('degradeMomentum', () => {
	it('bar=+3, no event/win -> bar=+2 after 1 possession', () => {
		const state = { ...createMomentumState(), bar: 3 };
		expect(degradeMomentum(state, context()).bar).toBe(2);
	});

	it('bar=+3, had event/win -> bar stays +3 (positive does not degrade with event/win)', () => {
		const state = { ...createMomentumState(), bar: 3 };
		expect(degradeMomentum(state, context({ hadSignificantEventOrWin: true })).bar).toBe(3);
	});

	it('bar=-3, no event/win -> bar=-2 (negative always degrades)', () => {
		const state = { ...createMomentumState(), bar: -3 };
		expect(degradeMomentum(state, context()).bar).toBe(-2);
	});

	it('bar=-3, had event/win -> bar=-2 (negative degrades even with an event)', () => {
		const state = { ...createMomentumState(), bar: -3 };
		expect(degradeMomentum(state, context({ hadSignificantEventOrWin: true })).bar).toBe(-2);
	});

	it('bar=+0.5, degradation -> bar=0, never crosses zero', () => {
		const state = { ...createMomentumState(), bar: 0.5 };
		expect(degradeMomentum(state, context()).bar).toBe(0);
	});

	it('bar=-0.5, degradation -> bar=0', () => {
		const state = { ...createMomentumState(), bar: -0.5 };
		expect(degradeMomentum(state, context()).bar).toBe(0);
	});

	it('bar=0 is stable', () => {
		const state = createMomentumState();
		expect(degradeMomentum(state, context()).bar).toBe(0);
	});

	it('Determination 16+ accelerates negative recovery: bar=-2 -> bar=0 in 1 possession', () => {
		const state = { ...createMomentumState(), bar: -2 };
		expect(degradeMomentum(state, context({ determinationAverage: 16 })).bar).toBe(0);
	});

	it('maxReached does not change with degradation', () => {
		const state = { ...createMomentumState(), bar: 3, maxReached: 4 };
		expect(degradeMomentum(state, context()).maxReached).toBe(4);
	});
});

// RF-008: degradation through a threshold re-arms the one-shot so it fires again
// on the next upward crossing. This path was not covered before degradeAndDetect.
describe('degradeAndDetect — threshold re-arm on degradation (RF-008)', () => {
	it('after degrading below +3 the one-shot fires again when bar climbs back to +3', () => {
		// Climb to +3 via events so the one-shot fires once (crossedThresholds = {3})
		let match = createMatchMomentumState();
		const barAt3 = applyEvent(match.home, 'goal'); // +2 → 2
		match = updateMomentum(match, 'home', barAt3).match;
		const barAt25 = applyEvent(match.home, 'possessionStreak'); // +1 → 3
		const { match: atThreshold, effects: firstCross } = updateMomentum(match, 'home', barAt25);
		expect(firstCross.some((e) => e.type === 'cardPowerBonus')).toBe(true);
		expect(atThreshold.home.crossedThresholds.has(3)).toBe(true);

		// Degrade below +3 — degradeAndDetect must emit a reset and clear crossedThresholds
		const noEvent = { hadSignificantEventOrWin: false, determinationAverage: 10 };
		const { match: degraded, effects: degrEffects } = degradeAndDetect(
			atThreshold,
			'home',
			noEvent,
		);
		// Bar dropped to +2; crossedThresholds must no longer contain 3
		expect(degraded.home.bar).toBe(2);
		expect(degraded.home.crossedThresholds.has(3)).toBe(false);
		// No upward threshold effect on degradation itself
		expect(degrEffects.filter((e) => e.type === 'cardPowerBonus')).toHaveLength(0);

		// Climb back to +3 — one-shot must fire again
		const barBack = applyEvent(degraded.home, 'possessionStreak'); // +1 → 3
		const { effects: secondCross } = updateMomentum(degraded, 'home', barBack);
		expect(secondCross.some((e) => e.type === 'cardPowerBonus')).toBe(true);
	});
});
