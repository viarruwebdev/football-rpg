import type { Card as PlayedCardSource } from '@football-rpg/content';
import type { CardInstance, Hand, ImprovisedIntent, PlayedCard } from './types';

type Strip = 'defense' | 'midfield' | 'attack' | 'area';

// Table: strip × intent → naturalAttribute (6 rows per RF-016)
const IMPROVISE_TABLE: Record<string, Record<string, string>> = {
	defense: { pass: 'Passing', tackle: 'Tackling' },
	midfield: { pass: 'Passing', tackle: 'Tackling' },
	attack: { pass: 'Passing', cross: 'Crossing', shot: 'Finishing' },
	area: { shot: 'Finishing', pass: 'Passing' },
};

export function playCard(hand: Hand, card: CardInstance): { hand: Hand; played: PlayedCard } {
	const idx = hand.cards.findIndex((c) => c.instanceId === card.instanceId);
	if (idx === -1) throw new Error(`Card ${card.instanceId} not in hand`);
	const newCards = [...hand.cards];
	newCards.splice(idx, 1);
	return { hand: { cards: newCards }, played: { kind: 'natural', card: card.card } };
}

export function canConvert(card: PlayedCardSource): boolean {
	return card.potencia >= 2;
}

export function convertCard(card: PlayedCardSource, currentPhaseAttribute: string): PlayedCard {
	if (card.potencia < 2) {
		throw new Error(
			`convertCard: card.potencia < 2 (got ${card.potencia}) — caller must check canConvert first (RF-018)`,
		);
	}
	return {
		kind: 'converted',
		card,
		effectivePower: Math.floor(card.potencia / 2),
		naturalAttribute: currentPhaseAttribute,
	};
}

export function improviseCard(
	strip: Strip | string,
	intent: ImprovisedIntent | string,
): PlayedCard {
	const allowed = IMPROVISE_TABLE[strip];
	if (!allowed) throw new Error(`Unknown strip: ${strip}`);
	const attr = allowed[intent];
	if (!attr) {
		throw new Error(`Illegal intent '${intent}' in strip '${strip}' (RF-016)`);
	}
	return {
		kind: 'improvised',
		power: 0,
		intent: intent as ImprovisedIntent,
		naturalAttribute: attr,
	};
}
