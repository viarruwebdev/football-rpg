import { goalkeeperCards } from '@football-rpg/content';
import type {
	GoalkeeperAttributes,
	GoalkeeperCardData,
	GoalkeeperCardId,
	GoalkeeperSet,
} from './types';

function attrValue(attrs: GoalkeeperAttributes, key: string): number {
	const map: Record<string, keyof GoalkeeperAttributes> = {
		Handling: 'handling',
		'Aerial Reach': 'aerialReach',
		Reflexes: 'reflexes',
		'One on Ones': 'oneOnOnes',
	};
	const k = map[key];
	if (!k) throw new Error(`Unknown goalkeeper attribute key: ${key}`);
	return attrs[k];
}

export function regenerateGoalkeeperSet(attrs: GoalkeeperAttributes): GoalkeeperSet {
	const available = goalkeeperCards.filter(
		(c) => c.umbral === null || attrValue(attrs, c.umbralAtributo!) >= c.umbral,
	);
	return { available, usedThisPossession: new Set<GoalkeeperCardId>() };
}

export function useGoalkeeperCard(
	set: GoalkeeperSet,
	cardId: GoalkeeperCardId,
): { set: GoalkeeperSet; card: GoalkeeperCardData } | null {
	// Parada basica is unlimited — can be used every shot
	if (cardId !== 'parada-basica' && set.usedThisPossession.has(cardId)) {
		return null;
	}

	const card = set.available.find((c) => c.id === cardId);
	if (!card) return null;

	const newUsed = new Set(set.usedThisPossession);
	if (cardId !== 'parada-basica') {
		newUsed.add(cardId);
	}

	return { set: { ...set, usedThisPossession: newUsed }, card };
}
