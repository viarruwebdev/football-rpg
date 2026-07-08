import type { ShotModifierContext } from './types';

function distancePenalty(ctx: ShotModifierContext): number {
	if (ctx.shotZone === 'area') return 0;
	const raw = ctx.shotZone === 'attack' ? -3 : -5;
	if (ctx.longShotsAttribute >= 18) return 0;
	if (ctx.longShotsAttribute >= 16) return Math.min(raw + 2, 0); // techo en 0, no suelo
	return raw;
}

export function applyShotModifiers(ctx: ShotModifierContext): number[] {
	const mods: number[] = [];

	if (ctx.hasAssist) mods.push(3);
	if (ctx.isHeaderAfterCross) mods.push(2);
	if (ctx.hadForcedAdvance) mods.push(-2);

	const dist = distancePenalty(ctx);
	if (dist !== 0) mods.push(dist);

	if (ctx.isLateralAngle) mods.push(-2);

	return mods;
}
