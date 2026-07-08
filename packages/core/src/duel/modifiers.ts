const FULL_TIER = 4;
const HALF_TIER = 4;

export function applyDiminishing(modifiers: number[]): number {
	const raw = modifiers.reduce((sum, mod) => sum + mod, 0);
	const sign = Math.sign(raw);
	const magnitude = Math.abs(raw);

	const fullPortion = Math.min(magnitude, FULL_TIER);
	const halfRemaining = Math.max(magnitude - FULL_TIER, 0);
	const halfPortion = Math.min(halfRemaining, HALF_TIER);
	const thirdRemaining = Math.max(magnitude - FULL_TIER - HALF_TIER, 0);

	const effective = fullPortion + halfPortion * 0.5 + thirdRemaining / 3;

	return sign * Math.round(effective);
}
