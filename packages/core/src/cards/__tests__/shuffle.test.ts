import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { shuffleDeck } from '../shuffle';

describe('shuffleDeck', () => {
	it('misma semilla produce mismo orden dos veces (determinismo)', () => {
		const cards = ['a', 'b', 'c', 'd', 'e'];
		const r1 = shuffleDeck(cards, makeRng(42));
		const r2 = shuffleDeck(cards, makeRng(42));
		expect(r1).toEqual(r2);
	});

	it('resultado es permutación: mismas cartas, potencialmente distinto orden', () => {
		fc.assert(
			fc.property(
				fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
				(ids) => {
					const shuffled = shuffleDeck(ids, makeRng(1));
					expect([...shuffled].sort()).toEqual([...ids].sort());
				},
			),
		);
	});

	it('no muta el array de entrada', () => {
		const original = ['x', 'y', 'z'];
		const copy = [...original];
		shuffleDeck(original, makeRng(7));
		expect(original).toEqual(copy);
	});
});
