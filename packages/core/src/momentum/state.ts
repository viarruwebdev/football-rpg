import type { MatchMomentumState, MomentumState } from './types';

export function createMomentumState(): MomentumState {
	return {
		bar: 0,
		consecutiveWins: 0,
		maxReached: 0,
		playsAtPeakPositive: 0,
		crossedThresholds: new Set(),
		playerInTheZone: null,
	};
}

export function createMatchMomentumState(): MatchMomentumState {
	return { home: createMomentumState(), away: createMomentumState() };
}

export function resetConsecutiveWins(state: MomentumState): MomentumState {
	return { ...state, consecutiveWins: 0 };
}

export function saturate(bar: number): number {
	return Math.max(-5, Math.min(5, bar));
}

export function updateDerived(
	prev: MomentumState,
	newBar: number,
): Pick<MomentumState, 'maxReached' | 'playsAtPeakPositive'> {
	return {
		maxReached: Math.max(prev.maxReached, newBar),
		playsAtPeakPositive: newBar === 5 ? prev.playsAtPeakPositive + 1 : 0,
	};
}
