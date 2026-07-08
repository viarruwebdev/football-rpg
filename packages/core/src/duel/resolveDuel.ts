import type { Rng } from '../rng/types';
import { attributeToInfluence } from './attributeToInfluence';
import { classify } from './classify';
import { emitEvents } from './events';
import { applyDiminishing } from './modifiers';
import type { DuelInput, DuelResult, DuelSide } from './types';
import { computeBand, sampleTriangular } from './uncertainty';

const LANE_HIT_BONUS = 2;
const LANE_MISS_PENALTY = -1;

function baseStrength(side: DuelSide): number {
	return side.cardPower + attributeToInfluence(side.attribute) + applyDiminishing(side.modifiers);
}

function laneEffect(attack: DuelSide, defense: DuelSide): number {
	if (!attack.chosenLane || !defense.bettedLane) {
		return 0;
	}
	return attack.chosenLane === defense.bettedLane ? LANE_HIT_BONUS : LANE_MISS_PENALTY;
}

export function resolveDuel(input: DuelInput, rng: Rng): DuelResult {
	const { attack, defense } = input;

	// v1: no catalog yet, no-op extension points
	for (const _instant of input.preRevealInstants ?? []) {
		// no-op
	}
	for (const _effect of input.postRevealEffects ?? []) {
		// no-op
	}

	const attackStrength = baseStrength(attack);
	const defenseStrength = baseStrength(defense) + laneEffect(attack, defense);

	const differential = attackStrength - defenseStrength;

	const bothSidesHaveSpecialTechnique =
		Boolean(attack.specialTechnique) && Boolean(defense.specialTechnique);
	const band = computeBand(differential, attack.composure, bothSidesHaveSpecialTechnique);
	const uncertainty = sampleTriangular(band, rng.split());

	const result = differential + uncertainty;
	const segment = classify(result);
	const events = emitEvents(segment);

	return { result, segment, events };
}
