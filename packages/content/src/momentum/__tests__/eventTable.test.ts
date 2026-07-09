import { describe, expect, it } from 'vitest';
import { MomentumEventTableSchema, momentumEventTable } from '../eventTable';

describe('momentumEventTable', () => {
	it('validates against the Zod schema without throwing', () => {
		expect(() => MomentumEventTableSchema.parse(momentumEventTable)).not.toThrow();
	});

	it('has all 8 event causes present', () => {
		const causes = [
			'goal',
			'tideTurningGoal',
			'specialTechniqueSuccess',
			'epicSave',
			'oneOnOneSave',
			'pressingSteal',
			'possessionStreak',
			'greatSave',
		] as const;
		for (const cause of causes) {
			expect(momentumEventTable[cause]).toBeDefined();
		}
	});

	it('has exact deltas per §7 (manual, not memory)', () => {
		expect(momentumEventTable.goal).toBe(2);
		expect(momentumEventTable.tideTurningGoal).toBe(3);
		expect(momentumEventTable.specialTechniqueSuccess).toBe(1);
		expect(momentumEventTable.epicSave).toBe(1);
		expect(momentumEventTable.oneOnOneSave).toBe(1);
		expect(momentumEventTable.pressingSteal).toBe(1);
		expect(momentumEventTable.possessionStreak).toBe(1);
		expect(momentumEventTable.greatSave).toBe(1);
	});
});
