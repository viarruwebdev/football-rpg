import type { DuelSegment } from './types';
import { roundForClassify } from './uncertainty';

export function classify(result: number): DuelSegment {
	const rounded = roundForClassify(result);
	if (rounded >= 6) return 'crushingSuccess';
	if (rounded >= 3) return 'cleanSuccess';
	if (rounded >= 1) return 'forcedAdvance';
	if (rounded === 0) return 'splitBall';
	if (rounded >= -2) return 'simpleLoss';
	if (rounded >= -5) return 'disadvantagedLoss';
	return 'devastatingCounter';
}
