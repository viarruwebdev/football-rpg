import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../mulberry32';
import { splitN } from '../splitN';

describe('splitN', () => {
	it('returns the requested number of children', () => {
		const children = splitN(makeRng(1), 3);
		expect(children).toHaveLength(3);
	});

	it('produces children with pairwise distinct next() values', () => {
		const [a, b, c] = splitN(makeRng(42), 3);
		const values = [a?.next(), b?.next(), c?.next()];
		expect(new Set(values).size).toBe(3);
	});

	it('is deterministic: same rng state and count produce the same children', () => {
		const [a1, b1] = splitN(makeRng(7), 2);
		const [a2, b2] = splitN(makeRng(7), 2);
		expect(a1?.next()).toBe(a2?.next());
		expect(b1?.next()).toBe(b2?.next());
	});

	it('does not mutate the parent rng', () => {
		const rng = makeRng(9);
		const before = rng.next();
		splitN(rng, 5);
		const after = rng.next();
		expect(before).toBe(after);
	});

	it('property: children are pairwise distinct for any seed and count >= 2', () => {
		fc.assert(
			fc.property(fc.integer(), fc.integer({ min: 2, max: 10 }), (seed, count) => {
				const children = splitN(makeRng(seed), count);
				const values = children.map((child) => child.next());
				expect(new Set(values).size).toBe(count);
			}),
		);
	});
});
