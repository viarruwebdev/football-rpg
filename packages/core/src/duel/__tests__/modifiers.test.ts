import { describe, expect, it } from 'vitest';
import { applyDiminishing } from '../modifiers';

describe('applyDiminishing', () => {
	it('returns 0 for an empty array', () => {
		expect(applyDiminishing([])).toBe(0);
	});

	it.each([
		[[3], 3],
		[[4], 4],
		[[6], 5],
		[[8], 6],
		[[10], 7],
		[[12], 7],
	])('applies diminishing returns: %j -> %i', (mods, expected) => {
		expect(applyDiminishing(mods)).toBe(expected);
	});

	it('is symmetric for negative accumulations', () => {
		expect(applyDiminishing([-6])).toBe(-5);
		expect(applyDiminishing([-10])).toBe(-7);
	});
});
