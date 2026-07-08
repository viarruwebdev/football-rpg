import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { computeBand, sampleTriangular } from '../uncertainty';

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
});

describe('sampleTriangular range', () => {
	it('stays within [-band, +band] for any band >= 3 and any seed', () => {
		fc.assert(
			fc.property(fc.integer({ min: 3, max: 8 }), fc.integer(), (band, seed) => {
				const value = sampleTriangular(band, makeRng(seed));
				expect(value).toBeGreaterThanOrEqual(-band);
				expect(value).toBeLessThanOrEqual(band);
			}),
		);
	});
});
