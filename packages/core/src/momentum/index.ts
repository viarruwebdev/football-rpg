export { degradeMomentum } from './degradation';
export { applyDuelResult } from './duelResult';
export { applyEvent } from './events';
export { computeMomentumModifier } from './modifier';
export { shotSegmentToMomentumCause } from './shotCause';
export { createMatchMomentumState, createMomentumState, resetConsecutiveWins } from './state';
export { applyThresholdEffects, detectThresholdCrossing } from './thresholds';
export type {
	DegradationContext,
	MatchMomentumState,
	MomentumEventCause,
	MomentumSide,
	MomentumState,
	MomentumThreshold,
	PlayerInTheZone,
	ThresholdEffect,
	ThresholdReset,
	TraitHook,
	TraitHookContext,
} from './types';
export { degradeAndDetect, updateMomentum } from './updateMomentum';
