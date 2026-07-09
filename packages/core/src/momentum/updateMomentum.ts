import { applyThresholdEffects, detectThresholdCrossing } from './thresholds';
import type { MatchMomentumState, MomentumSide, MomentumState, ThresholdEffect } from './types';

export function updateMomentum(
	match: MatchMomentumState,
	movedSide: MomentumSide,
	newBarState: MomentumState,
): { match: MatchMomentumState; effects: ThresholdEffect[] } {
	const after: MatchMomentumState = { ...match, [movedSide]: newBarState };
	const { effects, resets } = detectThresholdCrossing(match, after, movedSide);

	const home = applyThresholdEffects(after.home, effects, resets, 'home');
	const away = applyThresholdEffects(after.away, effects, resets, 'away');

	return { match: { home, away }, effects };
}
