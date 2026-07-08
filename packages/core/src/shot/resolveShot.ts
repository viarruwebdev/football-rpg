import { applyDiminishing, attributeToInfluence, computeBand, sampleTriangular } from '../duel';
import type { Rng } from '../rng/types';
import { classifyShot } from './classify';
import { emitShotEvents } from './events';
import { applyShotModifiers } from './modifiers';
import type { ShotInput, ShotResult } from './types';

export function resolveShot(input: ShotInput, rng: Rng): ShotResult {
	const shooterStrength =
		input.shooter.cardPower +
		attributeToInfluence(input.shooter.attribute) +
		applyDiminishing(applyShotModifiers(input.modifierContext));

	const keeperStrength =
		input.keeper.cardPower +
		attributeToInfluence(input.keeper.attribute) +
		applyDiminishing(input.keeper.modifiers);

	const differential = shooterStrength - keeperStrength;
	const band = computeBand(differential, input.shooter.composure, false);
	const uncertainty = sampleTriangular(band, rng.split());
	const result = differential + uncertainty;
	const segment = classifyShot(result);
	const events = emitShotEvents(segment);

	return { result, segment, events };
}
