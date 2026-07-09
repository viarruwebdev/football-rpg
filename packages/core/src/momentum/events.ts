import { momentumEventTable } from '@football-rpg/content';
import { saturate, updateDerived } from './state';
import type { MomentumEventCause, MomentumState } from './types';

export function applyEvent(state: MomentumState, cause: MomentumEventCause): MomentumState {
	const delta =
		cause === 'tideTurningGoal' && !(state.bar < 0)
			? momentumEventTable.goal
			: momentumEventTable[cause];

	const newBar = saturate(state.bar + delta);

	return {
		...state,
		bar: newBar,
		...updateDerived(state, newBar),
	};
}
