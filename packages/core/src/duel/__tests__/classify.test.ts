import { describe, expect, it } from 'vitest';
import { classify } from '../classify';

describe('classify', () => {
	it.each([
		[10, 'crushingSuccess'],
		[6, 'crushingSuccess'],
		[5, 'cleanSuccess'],
		[4, 'cleanSuccess'],
		[3, 'cleanSuccess'],
		[2, 'forcedAdvance'],
		[1, 'forcedAdvance'],
		[0, 'splitBall'],
		[-1, 'simpleLoss'],
		[-2, 'simpleLoss'],
		[-3, 'disadvantagedLoss'],
		[-5, 'disadvantagedLoss'],
		[-6, 'devastatingCounter'],
		[-10, 'devastatingCounter'],
	])('classifies %i as %s', (result, expected) => {
		expect(classify(result)).toBe(expected);
	});
});
