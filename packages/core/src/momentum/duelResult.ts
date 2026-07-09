import { momentumDuelResultTable } from '@football-rpg/content';
import type { DuelSegment } from '../duel';
import { saturate, updateDerived } from './state';
import type { MomentumState } from './types';

const WINNING_SEGMENTS: ReadonlySet<DuelSegment> = new Set(['cleanSuccess', 'crushingSuccess']);
const LOSING_SEGMENTS: ReadonlySet<DuelSegment> = new Set([
	'simpleLoss',
	'disadvantagedLoss',
	'devastatingCounter',
]);

export function applyDuelResult(state: MomentumState, segment: DuelSegment): MomentumState {
	const delta = momentumDuelResultTable[segment];
	const newBar = saturate(state.bar + delta);

	let consecutiveWins = state.consecutiveWins;
	if (WINNING_SEGMENTS.has(segment)) {
		consecutiveWins += 1;
	} else if (LOSING_SEGMENTS.has(segment)) {
		consecutiveWins = 0;
	}

	return {
		...state,
		bar: newBar,
		consecutiveWins,
		...updateDerived(state, newBar),
	};
}
