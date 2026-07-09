import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { computeMomentumModifier } from '../index';

describe('computeMomentumModifier', () => {
	it('clamps 0.15 * bar within [-0.75, +0.75] for integer bars', () => {
		for (let bar = -5; bar <= 5; bar++) {
			const expected = Math.max(-0.75, Math.min(0.75, 0.15 * bar));
			expect(computeMomentumModifier(bar)).toBeCloseTo(expected, 10);
		}
	});

	it('bar=0 -> 0', () => {
		expect(computeMomentumModifier(0)).toBe(0);
	});

	it('bar=5 -> 0.75', () => {
		expect(computeMomentumModifier(5)).toBeCloseTo(0.75, 10);
	});

	it('bar=-5 -> -0.75', () => {
		expect(computeMomentumModifier(-5)).toBeCloseTo(-0.75, 10);
	});

	it('handles fractional bars', () => {
		expect(computeMomentumModifier(3.5)).toBeCloseTo(0.525, 10);
		expect(computeMomentumModifier(-2.5)).toBeCloseTo(-0.375, 10);
	});

	it('property: no external amplifier ever breaks the ±0.75 cap', () => {
		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
				(bar) => {
					const modifier = computeMomentumModifier(bar);
					expect(modifier).toBeGreaterThanOrEqual(-0.75);
					expect(modifier).toBeLessThanOrEqual(0.75);
				},
			),
		);
	});
});
