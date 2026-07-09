import { describe, expect, it } from 'vitest';
import type { DuelSegment } from '../../duel';
import { applyDuelResult, createMomentumState } from '../index';

describe('applyDuelResult', () => {
	const segmentDeltas: Array<{ segment: DuelSegment; delta: number }> = [
		{ segment: 'crushingSuccess', delta: 1 },
		{ segment: 'cleanSuccess', delta: 0.5 },
		{ segment: 'forcedAdvance', delta: 0 },
		{ segment: 'splitBall', delta: 0 },
		{ segment: 'simpleLoss', delta: -1 },
		{ segment: 'disadvantagedLoss', delta: -1.5 },
		{ segment: 'devastatingCounter', delta: -2 },
	];

	it.each(segmentDeltas)('applies exact delta for $segment', ({ segment, delta }) => {
		const state = createMomentumState();
		const next = applyDuelResult(state, segment);
		expect(next.bar).toBe(delta);
	});

	it('crushingSuccess gives +1, NOT +1.5 (does not stack with cleanSuccess)', () => {
		const state = createMomentumState();
		const next = applyDuelResult(state, 'crushingSuccess');
		expect(next.bar).toBe(1);
	});

	it('devastatingCounter gives -2, not -3.5 (no stacking of loss tiers)', () => {
		const state = createMomentumState();
		const next = applyDuelResult(state, 'devastatingCounter');
		expect(next.bar).toBe(-2);
	});

	it('splitBall and forcedAdvance do not move momentum', () => {
		const state = createMomentumState();
		expect(applyDuelResult(state, 'splitBall').bar).toBe(0);
		expect(applyDuelResult(state, 'forcedAdvance').bar).toBe(0);
	});

	it('consecutiveWins increments on cleanSuccess and crushingSuccess', () => {
		const state = { ...createMomentumState(), consecutiveWins: 2 };
		expect(applyDuelResult(state, 'cleanSuccess').consecutiveWins).toBe(3);
		expect(applyDuelResult(state, 'crushingSuccess').consecutiveWins).toBe(3);
	});

	it('consecutiveWins resets to 0 on any loss segment', () => {
		const state = { ...createMomentumState(), consecutiveWins: 3 };
		expect(applyDuelResult(state, 'simpleLoss').consecutiveWins).toBe(0);
		expect(applyDuelResult(state, 'disadvantagedLoss').consecutiveWins).toBe(0);
		expect(applyDuelResult(state, 'devastatingCounter').consecutiveWins).toBe(0);
	});

	it('splitBall does NOT reset nor increment consecutiveWins', () => {
		const state = { ...createMomentumState(), consecutiveWins: 2 };
		expect(applyDuelResult(state, 'splitBall').consecutiveWins).toBe(2);
	});

	it('forcedAdvance does NOT increment nor reset consecutiveWins — progression, not dominance', () => {
		const state = { ...createMomentumState(), consecutiveWins: 2 };
		expect(applyDuelResult(state, 'forcedAdvance').consecutiveWins).toBe(2);
	});
});
