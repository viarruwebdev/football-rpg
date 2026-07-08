import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../index';

describe('makeRng determinism property', () => {
	it('produces the same first value for the same seed', () => {
		fc.assert(
			fc.property(fc.integer(), (seed) => {
				const a = makeRng(seed).next();
				const b = makeRng(seed).next();
				expect(a).toBe(b);
			}),
		);
	});
});
