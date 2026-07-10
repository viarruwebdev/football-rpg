import type { MatchMomentumState, MomentumSide } from '../momentum';
import { applyEvent, computeMomentumModifier } from '../momentum';
import type { MatchEvent, PossessionState, Strip } from './types';

export function buildSituationalModifiers(
	pressure: number,
	momentumBar: number,
	extraModifiers: number[] = [],
): number[] {
	return [pressure, computeMomentumModifier(momentumBar), ...extraModifiers];
}

export function emitPossessionStreak(
	possession: PossessionState,
	momentum: MatchMomentumState,
	attackingSide: MomentumSide,
): { possession: PossessionState; momentum: MatchMomentumState; events: MatchEvent[] } {
	if (possession.duelsWonInPossession < 3 || possession.possessionStreakEmitted) {
		return { possession, momentum, events: [] };
	}

	const updatedMomentumSide = applyEvent(momentum[attackingSide], 'possessionStreak');
	const updatedMomentum: MatchMomentumState = {
		...momentum,
		[attackingSide]: updatedMomentumSide,
	};

	return {
		possession: { ...possession, possessionStreakEmitted: true },
		momentum: updatedMomentum,
		events: [{ type: 'momentumEventApplied', cause: 'possessionStreak', side: attackingSide }],
	};
}

export function emitPressingSteal(
	strip: Strip,
	stealingSide: MomentumSide,
	momentum: MatchMomentumState,
): { momentum: MatchMomentumState; events: MatchEvent[] } {
	// strip is from the ATTACKER's perspective — pressing steal only when stealing
	// in attacker's 'defense' or 'midfield' (advanced zone of the thief, far from
	// the stolen team's goal). NOT in 'attack' or 'area' (thief defending own goal).
	if (strip !== 'defense' && strip !== 'midfield') {
		return { momentum, events: [] };
	}

	const updatedMomentumSide = applyEvent(momentum[stealingSide], 'pressingSteal');
	const updatedMomentum: MatchMomentumState = {
		...momentum,
		[stealingSide]: updatedMomentumSide,
	};

	return {
		momentum: updatedMomentum,
		events: [{ type: 'momentumEventApplied', cause: 'pressingSteal', side: stealingSide }],
	};
}
