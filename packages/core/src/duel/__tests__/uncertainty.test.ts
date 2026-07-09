import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { computeBand, roundForBand, roundForClassify, sampleTriangular } from '../uncertainty';

describe('computeBand', () => {
	it.each([
		[0, 11, false, 10],
		[4, 11, false, 10],
		[5, 11, false, 11],
		[6, 11, false, 11],
		[7, 11, false, 12],
		[10, 11, false, 12],
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
		expect(base).toBe(Math.max(10 + adjustment, 3));
	});

	it('never goes below the floor of 3', () => {
		expect(computeBand(0, 18, false)).toBeGreaterThanOrEqual(3);
	});

	it('uses a fixed band of 4 when both sides have a special technique', () => {
		expect(computeBand(10, 18, true)).toBe(4);
		expect(computeBand(0, 1, true)).toBe(4);
	});
});

describe('roundForBand', () => {
	it.each([
		[4.4, 4],
		[4.5, 5],
		[4.6, 5],
		[-0.3, 0],
		[7.1, 7],
	])('rounds %s to %i', (differential, expected) => {
		// Math.round(-0.3) is JS's -0, numerically equal to 0 but not
		// Object.is-equal — use == so the -0/+0 distinction doesn't fail
		// an otherwise-correct rounding.
		expect(roundForBand(differential) === expected).toBe(true);
	});
});

describe('roundForClassify', () => {
	it.each([
		[5.4, 5],
		[5.5, 6],
		[5.6, 6],
		[0.4, 0],
		[0.5, 1],
	])('rounds %s to %i', (result, expected) => {
		expect(roundForClassify(result) === expected).toBe(true);
	});

	it('rounds -0.5 to 0, not -1 (JS Math.round semantics, documented behavior)', () => {
		expect(roundForClassify(-0.5) === 0).toBe(true);
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
