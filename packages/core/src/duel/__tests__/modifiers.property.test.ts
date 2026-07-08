import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyDiminishing } from '../modifiers';

describe('applyDiminishing monotonicity (invariant 4)', () => {
	it('increasing a raw modifier never reduces the effective total', () => {
		fc.assert(
			fc.property(
				fc.array(fc.integer({ min: -20, max: 20 }), { minLength: 1, maxLength: 5 }),
				fc.integer({ min: 0, max: 10 }),
				(mods, increment) => {
					const before = applyDiminishing(mods);
					const increased = [...mods];
					increased[0] = (increased[0] ?? 0) + increment;
					const after = applyDiminishing(increased);
					expect(after).toBeGreaterThanOrEqual(before);
				},
			),
		);
	});
});
