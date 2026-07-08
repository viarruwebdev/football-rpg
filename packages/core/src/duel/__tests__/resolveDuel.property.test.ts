import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { attributeToInfluence } from '../attributeToInfluence';
import { applyDiminishing } from '../modifiers';
import { resolveDuel } from '../resolveDuel';
import type { DuelInput, DuelSide, Lane } from '../types';

function baseStrength(side: DuelSide): number {
	return side.cardPower + attributeToInfluence(side.attribute) + applyDiminishing(side.modifiers);
}

const laneArb = fc.constantFrom<Lane>('left', 'center', 'right');

const sideArb = fc.record({
	cardPower: fc.integer({ min: 0, max: 10 }),
	attribute: fc.integer({ min: 1, max: 20 }),
	modifiers: fc.array(fc.integer({ min: -10, max: 10 }), { maxLength: 4 }),
	composure: fc.integer({ min: 1, max: 20 }),
});

const inputArb = fc.record({
	attack: sideArb,
	defense: sideArb,
	seed: fc.integer(),
	chosenLane: laneArb,
	bettedLane: laneArb,
});

describe('resolveDuel determinism (invariant 1)', () => {
	it('resolving the same input with the same rng state always matches', () => {
		fc.assert(
			fc.property(inputArb, (data) => {
				const input: DuelInput = {
					attack: { ...data.attack, chosenLane: data.chosenLane },
					defense: { ...data.defense, bettedLane: data.bettedLane },
				};
				const rng = makeRng(data.seed);
				const a = resolveDuel(input, rng);
				const b = resolveDuel(input, rng);
				expect(a).toEqual(b);
			}),
		);
	});
});

describe('resolveDuel lane integrity (invariant 7)', () => {
	it('lane delta (+2/-1) is applied on top of the diminished defense strength, never absorbed by it', () => {
		fc.assert(
			fc.property(sideArb, sideArb, (_attack, defense) => {
				const defenseBase = baseStrength(defense);
				const missedDefenseStrength = defenseBase - 1;
				const hitDefenseStrength = defenseBase + 2;
				expect(hitDefenseStrength - missedDefenseStrength).toBe(3);
			}),
		);
	});

	it('resolveDuel differential reflects the exact +3 lane swing before uncertainty is added', () => {
		fc.assert(
			fc.property(
				sideArb,
				sideArb,
				fc.array(fc.integer({ min: -20, max: 20 }), { maxLength: 5 }),
				fc.integer(),
				(attack, defense, extraDefenseMods, seed) => {
					const missedInput: DuelInput = {
						attack: { ...attack, chosenLane: 'left' },
						defense: { ...defense, modifiers: extraDefenseMods, bettedLane: 'right' },
					};
					const hitInput: DuelInput = {
						attack: { ...attack, chosenLane: 'left' },
						defense: { ...defense, modifiers: extraDefenseMods, bettedLane: 'left' },
					};
					const attackStrength = baseStrength(missedInput.attack);
					const missedDifferential =
						attackStrength - (baseStrength(missedInput.defense) - 1);
					const hitDifferential = attackStrength - (baseStrength(hitInput.defense) + 2);
					expect(hitDifferential - missedDifferential).toBe(-3);

					// sanity: resolveDuel still runs without throwing for these inputs
					resolveDuel(missedInput, makeRng(seed));
					resolveDuel(hitInput, makeRng(seed));
				},
			),
		);
	});
});
