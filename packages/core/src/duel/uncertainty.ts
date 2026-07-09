import { splitN } from '../rng/splitN';
import type { Rng } from '../rng/types';

const BAND_FLOOR = 3;
const SPECIAL_TECHNIQUE_BAND = 4;

// Values recalibrated in ADR-0001 (see specs/001-resolvedor-duelos/adr/0001-recalibrar-banda-dinamica.md)
// after fixing the sampleTriangular independence bug. The original 6/7/8 values
// were tuned against a degenerate (near-uniform) distribution; the corrected
// triangular distribution has less variance, so wider bands are needed to hit
// the same CE-002 success-rate targets.
function dynamicBand(absoluteDifferential: number): number {
	if (absoluteDifferential <= 4) return 10;
	if (absoluteDifferential <= 6) return 11;
	return 12;
}

function composureAdjustment(composure: number): number {
	if (composure >= 18) return -2;
	if (composure >= 15) return -1;
	if (composure >= 8) return 0;
	return 1;
}

// Momentum (feature 003) contributes fractional strength (+0.15/point, capped
// ±0.75), so differential can arrive as a non-integer. Band selection still
// operates on integer tramos (0-4 / 5-6 / 7+), so we round once, here, before
// comparing.
export function roundForBand(differential: number): number {
	return Math.round(differential);
}

// Same rationale as roundForBand: classify (duel and shot) compares the final
// Resultado against integer thresholds. Math.round(-0.5) is 0, not -1 — a
// Resultado of exactly -0.5 rounds toward splitBall/greatSave, not the loss
// segment below it. This is the documented, intended behavior (see tests).
export function roundForClassify(result: number): number {
	return Math.round(result);
}

export function computeBand(
	differential: number,
	attackerComposure: number,
	bothSidesHaveSpecialTechnique: boolean,
): number {
	if (bothSidesHaveSpecialTechnique) {
		return SPECIAL_TECHNIQUE_BAND;
	}
	const base = dynamicBand(Math.abs(roundForBand(differential)));
	const adjusted = base + composureAdjustment(attackerComposure);
	return Math.max(adjusted, BAND_FLOOR);
}

export function sampleTriangular(band: number, rng: Rng): number {
	// The two uniforms that form the triangular sum must come from two
	// independent child generators (see splitN's docblock for why).
	const [rngA, rngB] = splitN(rng, 2);
	if (!rngA || !rngB) {
		throw new Error('splitN(rng, 2) must return exactly 2 children');
	}
	const a = rngA.next();
	const b = rngB.next();
	const unit = (a + b) / 2; // triangular distribution in [0, 1), peak at 0.5
	const scaled = (unit - 0.5) * 2 * band; // scale to [-band, +band)
	return Math.round(scaled);
}
