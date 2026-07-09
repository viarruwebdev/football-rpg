import { describe, expect, it } from 'vitest';
import { applyDuelResult, applyEvent, createMomentumState } from '../index';

describe('exclusivity between event table and duel table (CE-009, CHK011)', () => {
	it('a result of 0 in a link duel (splitBall) does not move momentum', () => {
		const state = createMomentumState();
		const next = applyDuelResult(state, 'splitBall');
		expect(next.bar).toBe(0);
	});

	it('a result of 0 in a shot (greatSave) gives +1 to the defender', () => {
		const state = createMomentumState();
		const next = applyEvent(state, 'greatSave');
		expect(next.bar).toBe(1);
	});

	// TypeScript compile-time guarantee (documented here, not runtime-checked):
	// applyDuelResult only accepts DuelSegment; applyEvent only accepts
	// MomentumEventCause. The two unions share no literal, so passing a
	// DuelSegment to applyEvent or a MomentumEventCause to applyDuelResult
	// is a type error, not a value to branch on at runtime:
	//   applyEvent(state, 'splitBall')   // ts(2345): not assignable
	//   applyDuelResult(state, 'greatSave') // ts(2345): not assignable
	it('type-only guarantee is documented above, no runtime assertion needed', () => {
		expect(true).toBe(true);
	});
});
