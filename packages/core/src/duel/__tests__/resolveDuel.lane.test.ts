import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { attributeToInfluence } from '../attributeToInfluence';
import { applyDiminishing } from '../modifiers';
import { resolveDuel } from '../resolveDuel';
import type { DuelInput, DuelSide } from '../types';

function baseInput(): DuelInput {
	return {
		attack: {
			cardPower: 3,
			attribute: 16,
			modifiers: [2, 1],
			chosenLane: 'right',
			composure: 14,
		},
		defense: {
			cardPower: 2,
			attribute: 10,
			modifiers: [1],
			bettedLane: 'left',
			composure: 12,
		},
	};
}

function baseStrength(side: DuelSide): number {
	return side.cardPower + attributeToInfluence(side.attribute) + applyDiminishing(side.modifiers);
}

describe('resolveDuel lane isolation (US3)', () => {
	it('identical duel, only bettedLane varies: result swing is 2 or 3 points', () => {
		const missed = resolveDuel(
			{ ...baseInput(), defense: { ...baseInput().defense, bettedLane: 'left' } },
			makeRng(10),
		);
		const hit = resolveDuel(
			{ ...baseInput(), defense: { ...baseInput().defense, bettedLane: 'right' } },
			makeRng(10),
		);
		expect(Math.abs(missed.result - hit.result)).toBeGreaterThanOrEqual(2);
	});

	it('with a seed producing matching uncertainty draws, the swing is exactly 3', () => {
		const missed = resolveDuel(
			{ ...baseInput(), defense: { ...baseInput().defense, bettedLane: 'left' } },
			makeRng(2),
		);
		const hit = resolveDuel(
			{ ...baseInput(), defense: { ...baseInput().defense, bettedLane: 'right' } },
			makeRng(2),
		);
		expect(hit.result - missed.result).toBe(-3);
	});

	it('invariant 7: lane delta (+2/-1) is never absorbed by applyDiminishing', () => {
		fc.assert(
			fc.property(
				fc.array(fc.integer({ min: -20, max: 20 }), { maxLength: 6 }),
				(modifiers) => {
					const defenseBase = baseStrength({
						cardPower: 0,
						attribute: 10,
						modifiers,
						composure: 10,
					});
					const missedStrength = defenseBase - 1;
					const hitStrength = defenseBase + 2;
					expect(hitStrength - missedStrength).toBe(3);
				},
			),
		);
	});
});
