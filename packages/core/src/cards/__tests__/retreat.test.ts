import { attackCard, defenseCard, sharedCard } from '@football-rpg/content';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { createCardEconomyState } from '../deck';
import { applyRetreat } from '../retreat';

function makeDecks() {
	return {
		attack: Array.from({ length: 14 }, (_, i) => attackCard(3, `a${i}`)),
		defense: Array.from({ length: 8 }, (_, i) => defenseCard(2, `d${i}`)),
		shared: Array.from({ length: 6 }, (_, i) => sharedCard(2, `s${i}`)),
	};
}

describe('applyRetreat', () => {
	it('mano de 1: gasta la carta, retreatUsed activado, mano vacía', () => {
		let state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		// Reduce hand to 1
		const oneCard = state.hands.home.cards[0]!;
		state = { ...state, hands: { ...state.hands, home: { cards: [oneCard] } } };
		const result = applyRetreat(state, 'home', oneCard);
		expect(result.retreatUsedThisPossession.home).toBe(true);
		expect(result.hands.home.cards.length).toBe(0);
	});

	it('mano vacía lanza (RF-021)', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		const card = state.hands.home.cards[0]!;
		const emptyState = { ...state, hands: { ...state.hands, home: { cards: [] } } };
		expect(() => applyRetreat(emptyState, 'home', card)).toThrow();
	});

	it('segundo repliegue en la misma posesión lanza (RF-020)', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		const card1 = state.hands.home.cards[0]!;
		const after = applyRetreat(state, 'home', card1);
		const card2 = after.hands.home.cards[0]!;
		expect(() => applyRetreat(after, 'home', card2)).toThrow();
	});

	it('+2 NO se aplica aquí — el estado devuelto no tiene campo de bonus', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		const card = state.hands.home.cards[0]!;
		const result = applyRetreat(state, 'home', card);
		// No bonus field — the +2 is the caller's responsibility (extraModifiers)
		expect((result as unknown as Record<string, unknown>).retreatBonus).toBeUndefined();
	});
});
