import type { CardEconomyState, CardInstance, MatchSides } from './types';

function deckTypeForFase(fase: string): 'attack' | 'defense' | 'shared' {
	if (fase === 'A') return 'attack';
	if (fase === 'D') return 'defense';
	return 'shared';
}

// Removes `chosen` cards from hand and routes each to the bottom of its sub-deck.
// Pure routing: no limit check, no guard. Callers decide when to invoke it.
function routeDiscards(
	state: CardEconomyState,
	side: MatchSides,
	chosen: CardInstance[],
): CardEconomyState {
	const chosenIds = new Set(chosen.map((c) => c.instanceId));
	const newHand = state.hands[side]!.cards.filter((c) => !chosenIds.has(c.instanceId));

	let decks = { ...state.decks[side]! };
	for (const card of chosen) {
		const deckType = deckTypeForFase(card.card.fase);
		const sub = decks[deckType];
		decks = { ...decks, [deckType]: { ...sub, cards: [...sub.cards, card] } };
	}

	return {
		...state,
		hands: { ...state.hands, [side]: { cards: newHand } },
		decks: { ...state.decks, [side]: decks },
	};
}

export function discardToLimit(
	state: CardEconomyState,
	side: MatchSides,
	chosen: CardInstance[],
): CardEconomyState {
	if (state.hands[side]!.cards.length <= 7) return state;
	return routeDiscards(state, side, chosen);
}

export function mulligan(
	state: CardEconomyState,
	side: MatchSides,
	discarded: CardInstance[],
	currentPhase: 'attack' | 'defense' | 'shared',
): CardEconomyState {
	if (state.mulliganUsedThisPossession[side]) {
		throw new Error(`Mulligan already used this possession for side ${side}`);
	}

	// Route discarded cards to bottom of their sub-decks
	const stateAfterDiscard = routeDiscards(state, side, discarded);
	const handAfterDiscard = stateAfterDiscard.hands[side]!.cards;
	let deckSide = { ...stateAfterDiscard.decks[side]! };

	// Draw 2 from current phase sub-deck (draw what's available, no-fail)
	const sub = deckSide[currentPhase];
	const drawn = sub.cards.slice(0, 2);
	const remaining = sub.cards.slice(2);

	deckSide = { ...deckSide, [currentPhase]: { ...sub, cards: remaining } };

	// Hand: replace discarded slots with drawn (no growth)
	const newHandCards = [...handAfterDiscard, ...drawn].slice(
		0,
		Math.max(handAfterDiscard.length, state.hands[side]!.cards.length),
	);

	return {
		...state,
		decks: { ...state.decks, [side]: deckSide },
		hands: { ...state.hands, [side]: { cards: newHandCards } },
		mulliganUsedThisPossession: { ...state.mulliganUsedThisPossession, [side]: true },
	};
}
