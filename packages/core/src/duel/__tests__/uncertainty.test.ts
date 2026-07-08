import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { computeBand, sampleTriangular } from '../uncertainty';

describe('computeBand', () => {
	it.each([
		[0, 11, false, 6],
		[4, 11, false, 6],
		[5, 11, false, 7],
		[6, 11, false, 7],
		[7, 11, false, 8],
		[10, 11, false, 8],
	])('dynamic band for |diff|=%i and neutral composure -> %i', (diff, composure, special, expected) => {
		expect(computeBand(diff, composure, special)).toBe(expected);
	});

	it.each([
		[18, -2],
		[20, -2],
		[15, -1],
		[17, -1],
		[14, 0],
		[8, 0],
		[7, 1],
		[1, 1],
	])('composure %i applies adjustment %i to base band', (composure, adjustment) => {
		const base = computeBand(0, composure, false);
		expect(base).toBe(Math.max(6 + adjustment, 3));
	});

	it('never goes below the floor of 3', () => {
		expect(computeBand(0, 18, false)).toBeGreaterThanOrEqual(3);
	});

	it('uses a fixed band of 4 when both sides have a special technique', () => {
		expect(computeBand(10, 18, true)).toBe(4);
		expect(computeBand(0, 1, true)).toBe(4);
	});
});

describe('sampleTriangular', () => {
	it('returns an integer within [-band, +band]', () => {
		const rng = makeRng(7);
		const band = 6;
		const value = sampleTriangular(band, rng);
		expect(Number.isInteger(value)).toBe(true);
		expect(value).toBeGreaterThanOrEqual(-band);
		expect(value).toBeLessThanOrEqual(band);
	});

	it('is deterministic for the same rng state', () => {
		const a = sampleTriangular(6, makeRng(99));
		const b = sampleTriangular(6, makeRng(99));
		expect(a).toBe(b);
	});
});
