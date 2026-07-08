import { describe, expect, it } from 'vitest';
import { makeRng } from '../index';
import type { Rng } from '../types';

describe('Rng interface', () => {
	it('is satisfied by an object with next() and split()', () => {
		const candidate: Rng = {
			next: () => 0.5,
			split: () => candidate,
		};

		expect(typeof candidate.next).toBe('function');
		expect(typeof candidate.split).toBe('function');
	});

	it('makeRng(seed) returns an Rng', () => {
		const rng = makeRng(42);

		expect(typeof rng.next).toBe('function');
		expect(typeof rng.split).toBe('function');
	});
});
