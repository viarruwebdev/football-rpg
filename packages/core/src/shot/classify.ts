import type { ShotSegment } from './types';

export function classifyShot(result: number): ShotSegment {
	if (result >= 5) return 'unstoppableGoal';
	if (result >= 3) return 'goal';
	if (result >= 1) return 'goalOnRebound';
	if (result === 0) return 'greatSave';
	if (result >= -2) return 'solidSave';
	return 'counterattackSave';
}
