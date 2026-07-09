import { describe, expect, it } from 'vitest';
import { createMomentumState, degradeMomentum } from '../index';
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
