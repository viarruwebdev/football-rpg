import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { classify } from '../classify';

const SEGMENTS = [
	'crushingSuccess',
	'cleanSuccess',
	'forcedAdvance',
	'splitBall',
	'simpleLoss',
	'disadvantagedLoss',
	'devastatingCounter',
];

describe('classify coverage (CE-005, invariant 6)', () => {
	it('every integer falls into exactly one segment', () => {
		fc.assert(
			fc.property(fc.integer({ min: -1000, max: 1000 }), (result) => {
				const segment = classify(result);
				expect(SEGMENTS).toContain(segment);
			}),
		);
	});

	it('every fractional Resultado (momentum-ready) falls into exactly one segment', () => {
		fc.assert(
			fc.property(fc.double({ min: -15, max: 15, noNaN: true }), (result) => {
				const segment = classify(result);
				expect(SEGMENTS).toContain(segment);
			}),
		);
	});
});
