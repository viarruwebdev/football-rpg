import type { Rng } from '../rng/types';

const BAND_FLOOR = 3;
const SPECIAL_TECHNIQUE_BAND = 4;

function dynamicBand(absoluteDifferential: number): number {
	if (absoluteDifferential <= 4) return 6;
	if (absoluteDifferential <= 6) return 7;
	return 8;
}

function composureAdjustment(composure: number): number {
	if (composure >= 18) return -2;
	if (composure >= 15) return -1;
	if (composure >= 8) return 0;
	return 1;
}

export function computeBand(
	differential: number,
	attackerComposure: number,
	bothSidesHaveSpecialTechnique: boolean,
): number {
	if (bothSidesHaveSpecialTechnique) {
		return SPECIAL_TECHNIQUE_BAND;
	}
	const base = dynamicBand(Math.abs(differential));
	const adjusted = base + composureAdjustment(attackerComposure);
	return Math.max(adjusted, BAND_FLOOR);
}

export function sampleTriangular(band: number, rng: Rng): number {
	const a = rng.next();
	const b = rng.next();
	const unit = (a + b) / 2; // triangular distribution in [0, 1), peak at 0.5
	const scaled = (unit - 0.5) * 2 * band; // scale to [-band, +band)
	return Math.round(scaled);
}
