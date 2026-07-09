import { roundForClassify } from '../duel';
import type { ShotSegment } from './types';

export function classifyShot(result: number): ShotSegment {
	const rounded = roundForClassify(result);
	if (rounded >= 5) return 'unstoppableGoal';
	if (rounded >= 3) return 'goal';
	if (rounded >= 1) return 'goalOnRebound';
	if (rounded === 0) return 'greatSave';
	if (rounded >= -2) return 'solidSave';
	return 'counterattackSave';
}
