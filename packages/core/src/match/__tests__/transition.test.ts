import { describe, expect, it } from 'vitest';
import type { DuelSegment } from '../../duel';
import { segmentToTransition } from '../transition';

describe('segmentToTransition', () => {
	it.each<[DuelSegment, string]>([
		['crushingSuccess', 'crushingAdvance'],
		['cleanSuccess', 'cleanAdvance'],
		['forcedAdvance', 'forcedAdvance'],
		['splitBall', 'splitBall'],
		['simpleLoss', 'possessionLost'],
		['disadvantagedLoss', 'disadvantageLoss'],
		['devastatingCounter', 'devastatingCounter'],
	])('RF-020: %s → %s', (segment, kind) => {
		const transition = segmentToTransition(segment);
		expect(transition.kind).toBe(kind);
	});

	it('disadvantageLoss carries transitionBonus: 2', () => {
		const t = segmentToTransition('disadvantagedLoss');
		expect(t).toMatchObject({ kind: 'disadvantageLoss', transitionBonus: 2 });
	});

	it('devastatingCounter carries zoneBoost: 3', () => {
		const t = segmentToTransition('devastatingCounter');
		expect(t).toMatchObject({ kind: 'devastatingCounter', zoneBoost: 3 });
	});
});
