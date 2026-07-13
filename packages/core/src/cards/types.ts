import type { GoalkeeperCardData, Card as PlayedCardSource } from '@football-rpg/content';
import type { Strip } from '../match/types';

export type { PlayedCardSource };

export type GoalkeeperCardId =
	| 'parada-basica'
	| 'blocaje'
	| 'despeje-punos'
	| 'estirada'
	| 'achique';

export type ImprovisedIntent = 'pass' | 'cross' | 'shot' | 'tackle';

export type PlayedCard =
	| { kind: 'natural'; card: PlayedCardSource }
	| {
			kind: 'converted';
			card: PlayedCardSource;
			effectivePower: number;
			naturalAttribute: string;
	  }
	| { kind: 'improvised'; power: 0; intent: ImprovisedIntent; naturalAttribute: string };

export interface CardInstance {
	instanceId: string;
	card: PlayedCardSource;
}

export interface SubDeck {
	type: 'attack' | 'defense' | 'shared';
	cards: CardInstance[];
}

export interface Hand {
	cards: CardInstance[];
}

export interface GoalkeeperAttributes {
	reflexes: number;
	handling: number;
	aerialReach: number;
	oneOnOnes: number;
}

export interface GoalkeeperSet {
	available: GoalkeeperCardData[];
	usedThisPossession: Set<GoalkeeperCardId>;
}

export type MatchSides = 'home' | 'away';

export interface TeamDecks {
	attack: SubDeck;
	defense: SubDeck;
	shared: SubDeck;
}

export interface CardEconomyState {
	decks: Record<MatchSides, TeamDecks>;
	hands: Record<MatchSides, Hand>;
	goalkeeperSets: Record<MatchSides, GoalkeeperSet>;
	mulliganUsedThisPossession: Record<MatchSides, boolean>;
	retreatUsedThisPossession: Record<MatchSides, boolean>;
}

export interface RawDecks {
	attack: PlayedCardSource[];
	defense: PlayedCardSource[];
	shared: PlayedCardSource[];
}

export interface Instant {
	card: PlayedCardSource;
	timing: 'preReveal';
}

export type EffectHandler = (state: CardEconomyState) => CardEconomyState;

export type { GoalkeeperCardData, Strip };
