import type { CardEconomyState, MatchSides } from './types';

export function drawOnCrushingSuccess(state: CardEconomyState, side: MatchSides): CardEconomyState {
	const deck = state.decks[side]!;
	// Draw 1 from attack sub-deck (attacking side wins the crushing advance)
	const [drawn, ...rest] = deck.attack.cards;
	if (!drawn) return state; // agotado — no-fail (RF-006)

	return {
		...state,
		decks: {
			...state.decks,
			[side]: { ...deck, attack: { ...deck.attack, cards: rest } },
		},
		hands: {
			...state.hands,
			[side]: { cards: [...state.hands[side]!.cards, drawn] },
		},
	};
}
