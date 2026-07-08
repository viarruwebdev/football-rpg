import type { DuelSegment } from './types';

export function classify(result: number): DuelSegment {
	if (result >= 6) return 'crushingSuccess';
	if (result >= 3) return 'cleanSuccess';
	if (result >= 1) return 'forcedAdvance';
	if (result === 0) return 'splitBall';
	if (result >= -2) return 'simpleLoss';
	if (result >= -5) return 'disadvantagedLoss';
	return 'devastatingCounter';
}
