import { attackCard, defenseCard, zeroPowerCard } from '@football-rpg/content';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { createCardEconomyState } from '../deck';
import { canConvert, convertCard, improviseCard, playCard } from '../play';

function makeDecks() {
	return {
		attack: Array.from({ length: 14 }, (_, i) => attackCard(3, `a${i}`)),
		defense: Array.from({ length: 8 }, (_, i) => defenseCard(2, `d${i}`)),
		shared: Array.from({ length: 6 }, (_, i) => ({
			...attackCard(2, `s${i}`),
			fase: 'I' as const,
		})),
	};
}

describe('playCard', () => {
	it('devuelve PlayedCard kind:natural y elimina la carta de la mano', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		const card = state.hands.home.cards[0]!;
		const { hand, played } = playCard(state.hands.home, card);
		expect(played.kind).toBe('natural');
		expect(hand.cards).not.toContain(card);
		expect(hand.cards.length).toBe(state.hands.home.cards.length - 1);
	});
});

describe('canConvert', () => {
	it('false para potencia 0', () => {
		expect(canConvert(zeroPowerCard())).toBe(false);
	});

	it('false para potencia 1', () => {
		expect(canConvert(attackCard(1))).toBe(false);
	});

	it('true para potencia 2', () => {
		expect(canConvert(attackCard(2))).toBe(true);
	});
});

describe('convertCard', () => {
	it('potencia 4 → effectivePower 2, con naturalAttribute correcto', () => {
		const result = convertCard(attackCard(4), 'Tackling');
		expect(result.kind).toBe('converted');
		if (result.kind === 'converted') {
			expect(result.effectivePower).toBe(2);
			expect(result.naturalAttribute).toBe('Tackling');
		}
	});

	it('potencia 3 → effectivePower 1 (floor)', () => {
		const result = convertCard(attackCard(3), 'Passing');
		expect(result.kind).toBe('converted');
		if (result.kind === 'converted') {
			expect(result.effectivePower).toBe(1);
		}
	});

	it('potencia 1 lanza (bug del llamador)', () => {
		expect(() => convertCard(attackCard(1), 'Passing')).toThrow();
	});

	it('potencia 0 lanza (bug del llamador)', () => {
		expect(() => convertCard(zeroPowerCard(), 'Passing')).toThrow();
	});
});

describe('improviseCard', () => {
	it('defense/tackle → Tackling', () => {
		const result = improviseCard('defense', 'tackle');
		expect(result).toMatchObject({
			kind: 'improvised',
			power: 0,
			intent: 'tackle',
			naturalAttribute: 'Tackling',
		});
	});

	it('attack/shot → Finishing', () => {
		const result = improviseCard('attack', 'shot');
		expect(result).toMatchObject({
			kind: 'improvised',
			power: 0,
			intent: 'shot',
			naturalAttribute: 'Finishing',
		});
	});

	it('attack/cross → Crossing', () => {
		const result = improviseCard('attack', 'cross');
		expect(result).toMatchObject({
			kind: 'improvised',
			power: 0,
			intent: 'cross',
			naturalAttribute: 'Crossing',
		});
	});

	it('midfield/pass → Passing', () => {
		const result = improviseCard('midfield', 'pass');
		expect(result).toMatchObject({
			kind: 'improvised',
			power: 0,
			intent: 'pass',
			naturalAttribute: 'Passing',
		});
	});

	it('defense/cross lanza (intención ilegal)', () => {
		expect(() => improviseCard('defense', 'cross')).toThrow();
	});

	it('area/tackle lanza (intención ilegal)', () => {
		expect(() => improviseCard('area', 'tackle')).toThrow();
	});
});
