import type { ShotEvent, ShotSegment } from './types';

export function emitShotEvents(segment: ShotSegment): ShotEvent[] {
	switch (segment) {
		case 'unstoppableGoal':
		case 'goal':
			return [{ type: 'goal' }, { type: 'momentum', side: 'attack', cause: 'goal' }];
		case 'goalOnRebound':
			return [
				{ type: 'goalOnRebound' },
				{ type: 'momentum', side: 'attack', cause: 'goalOnRebound' },
			];
		case 'greatSave':
			return [
				{ type: 'greatSave', hasCorner: true },
				{ type: 'momentum', side: 'defense', cause: 'greatSave' },
			];
		case 'solidSave':
			return [{ type: 'solidSave', roleReversal: true }];
		case 'counterattackSave':
			return [{ type: 'counterattackSave' }];
	}
}
