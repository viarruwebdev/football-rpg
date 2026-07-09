import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { computeBand, roundForBand, sampleTriangular } from '../uncertainty';

describe('computeBand floor (CE-004, invariant 3)', () => {
	it('never returns less than 3', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: -50, max: 50 }),
				fc.integer({ min: 1, max: 20 }),
				(diff, composure) => {
					expect(computeBand(diff, composure, false)).toBeGreaterThanOrEqual(3);
				},
			),
		);
	});

	it('never returns less than 3 for fractional differentials (momentum-ready)', () => {
		fc.assert(
			fc.property(
				fc.double({ min: -50, max: 50, noNaN: true }),
				fc.integer({ min: 1, max: 20 }),
				(diff, composure) => {
					expect(computeBand(diff, composure, false)).toBeGreaterThanOrEqual(3);
				},
			),
		);
	});
});

describe('roundForBand (momentum-ready rounding)', () => {
	it('always produces an integer for any fractional differential', () => {
		fc.assert(
			fc.property(fc.double({ min: -15, max: 15, noNaN: true }), (differential) => {
				expect(Number.isInteger(roundForBand(differential))).toBe(true);
			}),
		);
	});
});

describe('sampleTriangular range', () => {
	it('stays within [-band, +band] for any band >= 3 and any seed', () => {
		// Range covers actual production values: computeBand's max is
		// dynamicBand(7+)=12 + composureAdjustment(<8)=+1 = 13 (see uncertainty.ts).
		fc.assert(
			fc.property(fc.integer({ min: 3, max: 15 }), fc.integer(), (band, seed) => {
				const value = sampleTriangular(band, makeRng(seed));
				expect(value).toBeGreaterThanOrEqual(-band);
				expect(value).toBeLessThanOrEqual(band);
			}),
		);
	});
});
