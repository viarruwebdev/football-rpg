import { describe, expect, it } from 'vitest';
import { emitEvents } from '../events';
import type { DuelSegment } from '../types';

describe('emitEvents', () => {
	it('crushingSuccess -> advance + cardSteal + momentum(attack, +1)', () => {
		expect(emitEvents('crushingSuccess')).toEqual([
			{ type: 'advance', side: 'attack' },
			{ type: 'cardSteal', side: 'attack' },
			{ type: 'momentum', side: 'attack', delta: 1 },
		]);
	});

	it('cleanSuccess -> advance', () => {
		expect(emitEvents('cleanSuccess')).toEqual([{ type: 'advance', side: 'attack' }]);
	});

	it('forcedAdvance -> advance + pressure(+1)', () => {
		expect(emitEvents('forcedAdvance')).toEqual([
			{ type: 'advance', side: 'attack' },
			{ type: 'pressure', delta: 1 },
		]);
	});

	it('splitBall -> miniDuel', () => {
		expect(emitEvents('splitBall')).toEqual([{ type: 'miniDuel' }]);
	});

	it('simpleLoss -> transition', () => {
		expect(emitEvents('simpleLoss')).toEqual([{ type: 'transition' }]);
	});

	it('disadvantagedLoss -> transition + momentum(defense, +1)', () => {
		expect(emitEvents('disadvantagedLoss')).toEqual([
			{ type: 'transition' },
			{ type: 'momentum', side: 'defense', delta: 1 },
		]);
	});

	it('devastatingCounter -> transition + cardSteal(defense) + momentum(defense, +2)', () => {
		expect(emitEvents('devastatingCounter')).toEqual([
			{ type: 'transition' },
			{ type: 'cardSteal', side: 'defense' },
			{ type: 'momentum', side: 'defense', delta: 2 },
		]);
	});

	it('covers all seven segments', () => {
		const segments: DuelSegment[] = [
			'crushingSuccess',
			'cleanSuccess',
			'forcedAdvance',
			'splitBall',
			'simpleLoss',
			'disadvantagedLoss',
			'devastatingCounter',
		];
		for (const segment of segments) {
			expect(emitEvents(segment).length).toBeGreaterThan(0);
		}
	});
});
