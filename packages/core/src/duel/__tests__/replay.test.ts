import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { resolveDuel } from '../resolveDuel';
import type { DuelInput } from '../types';

function inputFor(index: number): DuelInput {
	return {
		attack: {
			cardPower: 1 + (index % 4),
			attribute: 8 + (index % 12),
			modifiers: [index % 3],
			chosenLane: (['left', 'center', 'right'] as const)[index % 3],
			composure: 6 + (index % 15),
		},
		defense: {
			cardPower: 1 + ((index + 2) % 4),
			attribute: 6 + ((index + 5) % 12),
			modifiers: [(index + 1) % 3],
			bettedLane: (['left', 'center', 'right'] as const)[(index + 1) % 3],
			composure: 6 + ((index + 3) % 15),
		},
	};
}

describe('golden replay — packages/core/src/duel/__tests__/__snapshots__/replay.test.ts.snap', () => {
	it('replays 50 seeded duels deterministically', () => {
		const rng = makeRng(12_345);
		const results = Array.from({ length: 50 }, (_, index) => resolveDuel(inputFor(index), rng));
		expect(results).toMatchSnapshot();
	});

	it('replays a fixed sequence of 20 more seeded duels (different generator, wider index range)', () => {
		const rng = makeRng(67_890);
		const results = Array.from({ length: 20 }, (_, index) =>
			resolveDuel(inputFor(index + 500), rng),
		);
		expect(results).toMatchSnapshot();
	});

	it('elite attacker vs poor defender, lane hit', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 4,
				attribute: 19,
				modifiers: [3, 2],
				chosenLane: 'right',
				composure: 16,
			},
			defense: {
				cardPower: 1,
				attribute: 3,
				modifiers: [-2],
				bettedLane: 'right',
				composure: 5,
			},
		};
		expect(resolveDuel(input, makeRng(1))).toMatchSnapshot();
	});

	it('elite attacker vs poor defender, lane miss', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 4,
				attribute: 19,
				modifiers: [3, 2],
				chosenLane: 'right',
				composure: 16,
			},
			defense: {
				cardPower: 1,
				attribute: 3,
				modifiers: [-2],
				bettedLane: 'left',
				composure: 5,
			},
		};
		expect(resolveDuel(input, makeRng(1))).toMatchSnapshot();
	});

	it('evenly matched sides (good vs good, same attribute and composure)', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 2,
				attribute: 14,
				modifiers: [1],
				chosenLane: 'center',
				composure: 12,
			},
			defense: {
				cardPower: 2,
				attribute: 14,
				modifiers: [1],
				bettedLane: 'center',
				composure: 12,
			},
		};
		expect(resolveDuel(input, makeRng(2))).toMatchSnapshot();
	});

	it('both sides have a special technique (fixed +-4 band, ignores differential and composure)', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 3,
				attribute: 18,
				modifiers: [],
				chosenLane: 'left',
				composure: 20,
				specialTechnique: 'overhead-kick',
			},
			defense: {
				cardPower: 1,
				attribute: 5,
				modifiers: [],
				bettedLane: 'left',
				composure: 1,
				specialTechnique: 'sliding-tackle',
			},
		};
		expect(resolveDuel(input, makeRng(3))).toMatchSnapshot();
	});

	it('only the attacker has a special technique (no fixed band, follows the normal pipeline)', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 3,
				attribute: 18,
				modifiers: [],
				chosenLane: 'left',
				composure: 20,
				specialTechnique: 'overhead-kick',
			},
			defense: {
				cardPower: 1,
				attribute: 5,
				modifiers: [],
				bettedLane: 'left',
				composure: 1,
			},
		};
		expect(resolveDuel(input, makeRng(3))).toMatchSnapshot();
	});

	it('extreme composure (>=18) narrows the band and high composure defender is stable', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 2,
				attribute: 12,
				modifiers: [],
				chosenLane: 'center',
				composure: 20,
			},
			defense: {
				cardPower: 2,
				attribute: 12,
				modifiers: [],
				bettedLane: 'center',
				composure: 20,
			},
		};
		expect(resolveDuel(input, makeRng(4))).toMatchSnapshot();
	});

	it('low composure (<8) widens the band under an even matchup', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 2,
				attribute: 12,
				modifiers: [],
				chosenLane: 'center',
				composure: 3,
			},
			defense: {
				cardPower: 2,
				attribute: 12,
				modifiers: [],
				bettedLane: 'center',
				composure: 3,
			},
		};
		expect(resolveDuel(input, makeRng(4))).toMatchSnapshot();
	});

	it('extreme diminishing-returns modifiers on both sides (large raw totals)', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 3,
				attribute: 15,
				modifiers: [10, 8, 6],
				chosenLane: 'right',
				composure: 10,
			},
			defense: {
				cardPower: 2,
				attribute: 10,
				modifiers: [-10, -8, -6],
				bettedLane: 'left',
				composure: 10,
			},
		};
		expect(resolveDuel(input, makeRng(5))).toMatchSnapshot();
	});

	it('empty modifiers on both sides (no situational mods)', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 2,
				attribute: 11,
				modifiers: [],
				chosenLane: 'left',
				composure: 11,
			},
			defense: {
				cardPower: 2,
				attribute: 11,
				modifiers: [],
				bettedLane: 'left',
				composure: 11,
			},
		};
		expect(resolveDuel(input, makeRng(6))).toMatchSnapshot();
	});

	it('devastating counter scenario (strong defender, weak attacker)', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 0,
				attribute: 3,
				modifiers: [-4],
				chosenLane: 'center',
				composure: 5,
			},
			defense: {
				cardPower: 4,
				attribute: 19,
				modifiers: [4, 3],
				bettedLane: 'center',
				composure: 18,
			},
		};
		expect(resolveDuel(input, makeRng(7))).toMatchSnapshot();
	});

	it('split ball scenario, seed 13 lands on an exact zero result', () => {
		const input: DuelInput = {
			attack: {
				cardPower: 2,
				attribute: 11,
				modifiers: [],
				chosenLane: 'right',
				composure: 12,
			},
			defense: {
				cardPower: 2,
				attribute: 11,
				modifiers: [],
				bettedLane: 'left',
				composure: 12,
			},
		};
		const result = resolveDuel(input, makeRng(13));
		expect(result.result).toBe(0);
		expect(result.segment).toBe('splitBall');
		expect(result).toMatchSnapshot();
	});
});
