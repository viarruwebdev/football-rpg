import { describe, expect, it } from 'vitest';
import { classifyShot } from '../classify';
import type { ShotSegment } from '../types';

describe('classifyShot', () => {
	const TABLE: Array<[number, ShotSegment]> = [
		[6, 'unstoppableGoal'],
		[5, 'unstoppableGoal'],
		[4, 'goal'],
		[3, 'goal'],
		[2, 'goalOnRebound'],
		[1, 'goalOnRebound'],
		[0, 'greatSave'],
		[-1, 'solidSave'],
		[-2, 'solidSave'],
		[-3, 'counterattackSave'],
		[-5, 'counterattackSave'],
		[-10, 'counterattackSave'],
	];

	it.each(TABLE)('result %i → %s', (result, expected) => {
		expect(classifyShot(result)).toBe(expected);
	});

	// Exhaustive no-gap invariant for a wide integer range
	it('covers every integer in [-20, +20] with exactly one segment', () => {
		const segments: ShotSegment[] = [
			'unstoppableGoal',
			'goal',
			'goalOnRebound',
			'greatSave',
			'solidSave',
			'counterattackSave',
		];
		for (let r = -20; r <= 20; r++) {
			const seg = classifyShot(r);
			expect(segments).toContain(seg);
		}
	});
});
