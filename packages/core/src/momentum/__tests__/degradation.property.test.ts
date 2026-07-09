import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createMomentumState, degradeMomentum } from '../index';
import type { DegradationContext } from '../types';

const contextArb: fc.Arbitrary<DegradationContext> = fc.record({
	hadSignificantEventOrWin: fc.boolean(),
	determinationAverage: fc.integer({ min: 1, max: 20 }),
});

const barArb = fc.float({ min: Math.fround(-5), max: Math.fround(5), noNaN: true });

describe('degradeMomentum property tests', () => {
	it('bar stays within [-5, +5] after degradation', () => {
		fc.assert(
			fc.property(barArb, contextArb, (bar, ctx) => {
				const state = { ...createMomentumState(), bar };
				const next = degradeMomentum(state, ctx);
				expect(next.bar).toBeGreaterThanOrEqual(-5);
				expect(next.bar).toBeLessThanOrEqual(5);
			}),
		);
	});

	it('a positive bar never becomes negative and vice versa (CE-013)', () => {
		fc.assert(
			fc.property(barArb, contextArb, (bar, ctx) => {
				const state = { ...createMomentumState(), bar };
				const next = degradeMomentum(state, ctx);
				if (bar > 0) expect(next.bar).toBeGreaterThanOrEqual(0);
				if (bar < 0) expect(next.bar).toBeLessThanOrEqual(0);
			}),
		);
	});

	it('maxReached never decreases', () => {
		fc.assert(
			fc.property(barArb, contextArb, (bar, ctx) => {
				const state = { ...createMomentumState(), bar, maxReached: Math.max(0, bar) };
				const next = degradeMomentum(state, ctx);
				expect(next.maxReached).toBeGreaterThanOrEqual(state.maxReached);
			}),
		);
	});
});
