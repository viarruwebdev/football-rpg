import { execSync } from 'node:child_process';
import { attackCard } from '@football-rpg/content';
import { describe, expect, it } from 'vitest';
import { cardToDuelSide, cardToShotSide } from '../adapter';

describe('cardToDuelSide', () => {
	it('natural card potencia 5, attr 14, composure 12', () => {
		const played = { kind: 'natural' as const, card: attackCard(5) };
		const side = cardToDuelSide(played, 14, 12, []);
		expect(side.cardPower).toBe(5);
		expect(side.attribute).toBe(2); // attributeToInfluence(14) = 2 (max 15 bucket)
		expect(side.composure).toBe(12);
		expect(side.modifiers).toEqual([]);
	});

	it('converted card effectivePower 2, attr 16, extraModifiers [2]', () => {
		const played = {
			kind: 'converted' as const,
			card: attackCard(4),
			effectivePower: 2,
			naturalAttribute: 'Passing',
		};
		const side = cardToDuelSide(played, 16, 10, [2]);
		expect(side.cardPower).toBe(2);
		expect(side.attribute).toBe(3); // attributeToInfluence(16) = 3 (max 17 bucket)
		expect(side.modifiers).toEqual([2]);
	});

	it('improvised shot from attack, attr 18 → cardPower 0, attribute +4', () => {
		const played = {
			kind: 'improvised' as const,
			power: 0 as const,
			intent: 'shot' as const,
			naturalAttribute: 'Finishing',
		};
		const side = cardToDuelSide(played, 18, 10, []);
		expect(side.cardPower).toBe(0);
		expect(side.attribute).toBe(4); // attributeToInfluence(18) = 4
	});

	it('cardToShotSide natural potencia 4', () => {
		const played = { kind: 'natural' as const, card: attackCard(4) };
		const side = cardToShotSide(played, 14, 10, []);
		expect(side.cardPower).toBe(4);
	});
});

describe('CE-012 — cards/adapter no reimplementa lógica de resolución', () => {
	it('grep de triangular/computeBand/sampleTriangular en cards/ devuelve vacío', () => {
		let output = '';
		try {
			output = execSync(
				'grep -rn --exclude-dir=__tests__ "triangular\\|computeBand\\|sampleTriangular" packages/core/src/cards/',
				{ encoding: 'utf8', cwd: '/home/vicente/www/football-rpg' },
			);
		} catch {
			// grep exits 1 when no matches — which is what we want
			output = '';
		}
		expect(output.trim()).toBe('');
	});
});
