import type { DuelSide } from '../duel';
import { attributeToInfluence } from '../duel';
import type { ShotSide } from '../shot';
import type { PlayedCard } from './types';

function powerOf(played: PlayedCard): number {
	if (played.kind === 'natural') return played.card.potencia;
	if (played.kind === 'converted') return played.effectivePower;
	return 0; // improvised
}

export function cardToDuelSide(
	played: PlayedCard,
	attribute: number,
	composure: number,
	extraModifiers: number[],
): DuelSide {
	return {
		cardPower: powerOf(played),
		attribute: attributeToInfluence(attribute),
		modifiers: extraModifiers,
		composure,
	};
}

export function cardToShotSide(
	played: PlayedCard,
	attribute: number,
	composure: number,
	extraModifiers: number[],
): ShotSide {
	return {
		cardPower: powerOf(played),
		attribute: attributeToInfluence(attribute),
		modifiers: extraModifiers,
		composure,
	};
}
