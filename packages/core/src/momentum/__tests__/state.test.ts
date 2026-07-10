import { describe, expect, it } from 'vitest';
import { createMomentumState, resetConsecutiveWins } from '../index';

describe('resetConsecutiveWins', () => {
	it('resets consecutiveWins > 0 to 0', () => {
		const state = { ...createMomentumState(), consecutiveWins: 5 };
		const result = resetConsecutiveWins(state);
		expect(result.consecutiveWins).toBe(0);
	});

	it('returns 0 when consecutiveWins is already 0', () => {
		const state = createMomentumState();
		const result = resetConsecutiveWins(state);
		expect(result.consecutiveWins).toBe(0);
	});

	it('does not mutate the rest of the state', () => {
		const state = { ...createMomentumState(), bar: 3, consecutiveWins: 4, maxReached: 3 };
		const result = resetConsecutiveWins(state);
		expect(result.bar).toBe(3);
		expect(result.maxReached).toBe(3);
		expect(result.consecutiveWins).toBe(0);
		expect(state.consecutiveWins).toBe(4);
	});
});
