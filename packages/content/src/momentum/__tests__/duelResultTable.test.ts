import { describe, expect, it } from 'vitest';
import { MomentumDuelTableSchema, momentumDuelResultTable } from '../duelResultTable';

describe('momentumDuelResultTable', () => {
	it('validates against the Zod schema without throwing', () => {
		expect(() => MomentumDuelTableSchema.parse(momentumDuelResultTable)).not.toThrow();
	});

	it('has all 7 segments present, no orphans', () => {
		const segments = [
			'crushingSuccess',
			'cleanSuccess',
			'forcedAdvance',
			'splitBall',
			'simpleLoss',
			'disadvantagedLoss',
			'devastatingCounter',
		] as const;
		for (const segment of segments) {
			expect(momentumDuelResultTable[segment]).toBeDefined();
		}
	});

	it('has exact deltas per §7 (manual, not memory)', () => {
		expect(momentumDuelResultTable.crushingSuccess).toBe(1);
		expect(momentumDuelResultTable.cleanSuccess).toBe(0.5);
		expect(momentumDuelResultTable.forcedAdvance).toBe(0);
		expect(momentumDuelResultTable.splitBall).toBe(0);
		expect(momentumDuelResultTable.simpleLoss).toBe(-1);
		expect(momentumDuelResultTable.disadvantagedLoss).toBe(-1.5);
		expect(momentumDuelResultTable.devastatingCounter).toBe(-2);
	});

	it('has no "won" key — cleanSuccess and forcedAdvance are distinct', () => {
		expect((momentumDuelResultTable as Record<string, unknown>).won).toBeUndefined();
	});
});
