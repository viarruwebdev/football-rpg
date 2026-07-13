import type { CardEconomyState, CardInstance, MatchSides } from './types';

export function applyRetreat(
	state: CardEconomyState,
	side: MatchSides,
	spentCard: CardInstance,
): CardEconomyState {
	if (state.hands[side]!.cards.length === 0) {
		throw new Error(`applyRetreat: hand is empty for side ${side} — cannot retreat (RF-021)`);
	}
	if (state.retreatUsedThisPossession[side]) {
		throw new Error(
			`applyRetreat: retreat already used this possession for side ${side} (RF-020)`,
		);
	}

	const newCards = state.hands[side]!.cards.filter((c) => c.instanceId !== spentCard.instanceId);

	return {
		...state,
		hands: { ...state.hands, [side]: { cards: newCards } },
		retreatUsedThisPossession: { ...state.retreatUsedThisPossession, [side]: true },
	};
}
