import { degradeMomentum } from './degradation';
import { applyThresholdEffects, detectThresholdCrossing } from './thresholds';
import type {
	DegradationContext,
	MatchMomentumState,
	MomentumSide,
	MomentumState,
	ThresholdEffect,
} from './types';

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

/** Orchestrates degradation + threshold detection for one side.
 *  degradeMomentum is a pure bar transformer; this function adds the
 *  detectThresholdCrossing pass so that re-arming happens on degradation
 *  just like it does after applyEvent / applyDuelResult. */
export function degradeAndDetect(
	match: MatchMomentumState,
	side: MomentumSide,
	context: DegradationContext,
): { match: MatchMomentumState; effects: ThresholdEffect[] } {
	const newBarState = degradeMomentum(match[side], context);
	return updateMomentum(match, side, newBarState);
}
