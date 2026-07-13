import { attackCard, defenseCard, sharedCard } from '@football-rpg/content';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { createCardEconomyState } from '../deck';
import { discardToLimit, mulligan } from '../hand';

function makeDecks() {
	return {
		attack: Array.from({ length: 14 }, (_, i) => attackCard(3, `a${i}`)),
		defense: Array.from({ length: 8 }, (_, i) => defenseCard(2, `d${i}`)),
		shared: Array.from({ length: 6 }, (_, i) => sharedCard(2, `s${i}`)),
	};
}

describe('discardToLimit', () => {
	it('mano de 9: descarta 2 elegidas al fondo del sub-mazo, mano queda en 7', () => {
		let state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		// Inject extra cards into hand to reach 9
		const extraA = state.decks.home.attack.cards[0]!;
		const extraB = state.decks.home.attack.cards[1]!;
		state = {
			...state,
			hands: {
				...state.hands,
				home: { cards: [...state.hands.home.cards, extraA, extraB] },
			},
			decks: {
				...state.decks,
				home: {
					...state.decks.home,
					attack: {
						...state.decks.home.attack,
						cards: state.decks.home.attack.cards.slice(2),
					},
				},
			},
		};
		expect(state.hands.home.cards.length).toBe(9);
		const chosen = [extraA, extraB];
		const result = discardToLimit(state, 'home', chosen);
		expect(result.hands.home.cards.length).toBe(7);
		// Chosen cards appear at the bottom (end) of attack sub-mazo
		const atkCards = result.decks.home.attack.cards;
		expect(atkCards[atkCards.length - 2]!.instanceId).toBe(extraA.instanceId);
		expect(atkCards[atkCards.length - 1]!.instanceId).toBe(extraB.instanceId);
	});

	it('mano <= 7: no cambia nada', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		expect(state.hands.home.cards.length).toBe(7);
		const result = discardToLimit(state, 'home', []);
		expect(result.hands.home.cards.length).toBe(7);
	});
});

describe('mulligan', () => {
	it('descarta <=2 y roba 2 del sub-mazo de fase, mano no crece', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		const initialLen = state.hands.home.cards.length;
		const toDiscard = [state.hands.home.cards[0]!];
		const result = mulligan(state, 'home', toDiscard, 'attack');
		// Mano no crece
		expect(result.hands.home.cards.length).toBeLessThanOrEqual(initialLen);
	});

	it('mulligan con 1 carta en sub-mazo: roba 1, no falla', () => {
		let state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		// Drain attack deck to 1 card
		state = {
			...state,
			decks: {
				...state.decks,
				home: {
					...state.decks.home,
					attack: {
						...state.decks.home.attack,
						cards: [state.decks.home.attack.cards[0]!],
					},
				},
			},
		};
		expect(() => mulligan(state, 'home', [], 'attack')).not.toThrow();
	});

	it('segundo mulligan en la misma posesión lanza', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		const after = mulligan(state, 'home', [], 'attack');
		expect(() => mulligan(after, 'home', [], 'attack')).toThrow();
	});
});
