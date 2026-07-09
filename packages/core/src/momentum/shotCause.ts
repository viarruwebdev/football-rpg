import type { ShotSegment } from '../shot/types';
import type { MomentumEventCause } from './types';

/**
 * Maps a ShotSegment to its MomentumEventCause for use in applyEvent.
 *
 * Returns null for segments that generate no momentum event (solidSave,
 * counterattackSave). The null is intentional and documents the §7 rule:
 * those tramos do not appear in the "eventos significativos" table.
 *
 * goalOnRebound → 'goal': §7 assigns +2 to the attacker for any goal regardless
 * of how it went in; the rebound distinction matters for game events (corner,
 * rebound logic) but not for the momentum delta.
 */
export function shotSegmentToMomentumCause(segment: ShotSegment): MomentumEventCause | null {
	switch (segment) {
		case 'unstoppableGoal':
		case 'goal':
		case 'goalOnRebound':
			return 'goal';
		case 'greatSave':
			return 'epicSave';
		case 'solidSave':
		case 'counterattackSave':
			return null;
	}
}
