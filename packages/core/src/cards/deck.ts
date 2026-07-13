import type { Rng } from '../rng';
import { regenerateGoalkeeperSet } from './goalkeeper';
import { shuffleDeck } from './shuffle';
import type {
	CardEconomyState,
	CardInstance,
	GoalkeeperSet,
	Hand,
	MatchSides,
	PlayedCardSource,
	RawDecks,
	SubDeck,
	TeamDecks,
} from './types';

function wrap(cards: PlayedCardSource[], type: SubDeck['type']): SubDeck {
	// Prefix instanceId with sub-deck type so attack:P01#0 and shared:P01#0 never collide.
	const instances: CardInstance[] = cards.map((card, i) => ({
		instanceId: `${type}:${card.id}#${i}`,
		card,
	}));
	return { type, cards: instances };
}

export function assertDeckFloor(decks: {
	attack: unknown[];
	defense: unknown[];
	shared: unknown[];
}): void {
	if (decks.attack.length < 14)
		throw new Error(`Attack deck floor violation: ${decks.attack.length} < 14`);
	if (decks.defense.length < 8)
		throw new Error(`Defense deck floor violation: ${decks.defense.length} < 8`);
}

export function createCardEconomyState(
	decks: Record<MatchSides, RawDecks>,
	rng: Rng,
): CardEconomyState {
	const sides = Object.keys(decks) as MatchSides[];
	const result: CardEconomyState = {
		decks: {} as Record<MatchSides, TeamDecks>,
		hands: {} as Record<MatchSides, Hand>,
		goalkeeperSets: {} as Record<MatchSides, GoalkeeperSet>,
		mulliganUsedThisPossession: {} as Record<MatchSides, boolean>,
		retreatUsedThisPossession: {} as Record<MatchSides, boolean>,
	};

	for (const side of sides) {
		const raw = decks[side]!;
		assertDeckFloor(raw);

		// Wrap cards with instanceId BEFORE shuffling (identity must not depend on shuffle order)
		const atkDeck = wrap(raw.attack, 'attack');
		const defDeck = wrap(raw.defense, 'defense');
		const sharedDeck = wrap(raw.shared, 'shared');

		// Shuffle each sub-deck with its own split rng
		const rngAtk = rng.split();
		const rngDef = rng.split();
		const rngSh = rng.split();

		const shuffledAtk: SubDeck = { type: 'attack', cards: shuffleDeck(atkDeck.cards, rngAtk) };
		const shuffledDef: SubDeck = { type: 'defense', cards: shuffleDeck(defDeck.cards, rngDef) };
		const shuffledShared: SubDeck = {
			type: 'shared',
			cards: shuffleDeck(sharedDeck.cards, rngSh),
		};

		// Deal initial hand: 5 attack + 2 defense
		const handCards: CardInstance[] = [];
		const atkCards = [...shuffledAtk.cards];
		const defCards = [...shuffledDef.cards];
		const shCards = [...shuffledShared.cards];

		for (let i = 0; i < 5 && atkCards.length > 0; i++) {
			handCards.push(atkCards.shift()!);
		}
		for (let i = 0; i < 2 && defCards.length > 0; i++) {
			handCards.push(defCards.shift()!);
		}

		result.decks[side] = {
			attack: { type: 'attack', cards: atkCards },
			defense: { type: 'defense', cards: defCards },
			shared: { type: 'shared', cards: shCards },
		};
		result.hands[side] = { cards: handCards };
		result.goalkeeperSets[side] = regenerateGoalkeeperSet({
			reflexes: 10,
			handling: 10,
			aerialReach: 10,
			oneOnOnes: 10,
		});
		result.mulliganUsedThisPossession[side] = false;
		result.retreatUsedThisPossession[side] = false;
	}

	return result;
}

export function drawOnPossessionChange(
	state: CardEconomyState,
	newAttacker: MatchSides,
): CardEconomyState {
	const newDefender = (Object.keys(state.decks) as MatchSides[]).find((s) => s !== newAttacker)!;

	let s = state;
	s = drawCards(s, newAttacker, 'attack', 2);
	s = drawCards(s, newAttacker, 'shared', 1);
	s = drawCards(s, newDefender, 'defense', 1);
	s = drawCards(s, newDefender, 'shared', 1);
	return s;
}

function drawCards(
	state: CardEconomyState,
	side: MatchSides,
	deckType: 'attack' | 'defense' | 'shared',
	count: number,
): CardEconomyState {
	const deck = { ...state.decks[side]! };
	const sub = { ...deck[deckType] };
	const hand = { ...state.hands[side]!, cards: [...state.hands[side]!.cards] };

	const drawn = sub.cards.slice(0, count);
	sub.cards = sub.cards.slice(count);
	hand.cards = [...hand.cards, ...drawn];

	return {
		...state,
		decks: { ...state.decks, [side]: { ...deck, [deckType]: sub } },
		hands: { ...state.hands, [side]: hand },
	};
}
