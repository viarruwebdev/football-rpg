import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { computeBand } from '../../duel/uncertainty';
import { makeRng } from '../../rng/mulberry32';
import { classifyShot } from '../classify';
import { applyShotModifiers } from '../modifiers';
import { resolveShot } from '../resolveShot';
import type { ShotInput, ShotSegment } from '../types';

const ALL_SEGMENTS: ShotSegment[] = [
	'unstoppableGoal',
	'goal',
	'goalOnRebound',
	'greatSave',
	'solidSave',
	'counterattackSave',
];

const arbAttribute = fc.integer({ min: 1, max: 20 });
const arbCardPower = fc.integer({ min: 0, max: 20 });
const arbComposure = fc.integer({ min: 1, max: 20 });
const arbLongShots = fc.integer({ min: 1, max: 20 });
const arbZone = fc.constantFrom('area' as const, 'attack' as const, 'midfield' as const);
const arbSeed = fc.integer({ min: 0, max: 2 ** 31 - 1 });

const arbShotInput = fc
	.record({
		shooterCardPower: arbCardPower,
		shooterAttribute: arbAttribute,
		shooterComposure: arbComposure,
		keeperCardPower: arbCardPower,
		keeperAttribute: arbAttribute,
		keeperComposure: arbComposure,
		hasAssist: fc.boolean(),
		isHeaderAfterCross: fc.boolean(),
		hadForcedAdvance: fc.boolean(),
		shotZone: arbZone,
		isLateralAngle: fc.boolean(),
		longShotsAttribute: arbLongShots,
	})
	.map(
		(r): ShotInput => ({
			shooter: {
				cardPower: r.shooterCardPower,
				attribute: r.shooterAttribute,
				modifiers: [],
				composure: r.shooterComposure,
			},
			keeper: {
				cardPower: r.keeperCardPower,
				attribute: r.keeperAttribute,
				modifiers: [],
				composure: r.keeperComposure,
			},
			modifierContext: {
				hasAssist: r.hasAssist,
				isHeaderAfterCross: r.isHeaderAfterCross,
				hadForcedAdvance: r.hadForcedAdvance,
				shotZone: r.shotZone,
				isLateralAngle: r.isLateralAngle,
				longShotsAttribute: r.longShotsAttribute,
			},
		}),
	);

describe('resolveShot property tests', () => {
	// T002 — every result falls in exactly one segment
	it('every result falls in exactly one segment (T002)', () => {
		fc.assert(
			fc.property(fc.integer({ min: -100, max: 100 }), (r) => {
				const seg = classifyShot(r);
				expect(ALL_SEGMENTS).toContain(seg);
			}),
		);
	});

	// T003 — band never below ±3
	it('band of uncertainty is never below ±3 (T003)', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: -50, max: 50 }),
				fc.integer({ min: 1, max: 20 }),
				(differential, composure) => {
					const band = computeBand(differential, composure, false);
					expect(band).toBeGreaterThanOrEqual(3);
				},
			),
		);
	});

	// T001 — determinism
	it('resolveShot is deterministic: same input+seed → same result (T001)', () => {
		fc.assert(
			fc.property(arbShotInput, arbSeed, (input, seed) => {
				const rng = makeRng(seed);
				const first = resolveShot(input, rng);
				const second = resolveShot(input, rng);
				expect(first).toEqual(second);
			}),
		);
	});

	// T009 — greatSave always has hasCorner: true
	it('greatSave always emits hasCorner: true (T009)', () => {
		fc.assert(
			fc.property(arbShotInput, arbSeed, (input, seed) => {
				const result = resolveShot(input, makeRng(seed));
				if (result.segment === 'greatSave') {
					const cornerEvent = result.events.find((e) => e.type === 'greatSave');
					expect(cornerEvent).toBeDefined();
					if (cornerEvent && cornerEvent.type === 'greatSave') {
						expect(cornerEvent.hasCorner).toBe(true);
					}
				}
			}),
		);
	});

	// T010 — solidSave always has roleReversal: true
	it('solidSave always emits roleReversal: true (T010)', () => {
		fc.assert(
			fc.property(arbShotInput, arbSeed, (input, seed) => {
				const result = resolveShot(input, makeRng(seed));
				if (result.segment === 'solidSave') {
					const saveEvent = result.events.find((e) => e.type === 'solidSave');
					expect(saveEvent).toBeDefined();
					if (saveEvent && saveEvent.type === 'solidSave') {
						expect(saveEvent.roleReversal).toBe(true);
					}
				}
			}),
		);
	});

	// T008 — Long Shots never converts penalty into bonus (suelo 0)
	it('Long Shots distance mod never becomes positive (T008)', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('attack' as const, 'midfield' as const),
				fc.integer({ min: 1, max: 20 }),
				(shotZone, longShotsAttribute) => {
					const mods = applyShotModifiers({
						hasAssist: false,
						isHeaderAfterCross: false,
						hadForcedAdvance: false,
						shotZone,
						isLateralAngle: false,
						longShotsAttribute,
					});
					// All mods must be ≤ 0 (no positive mods since no assist/header/etc.)
					for (const m of mods) {
						expect(m).toBeLessThanOrEqual(0);
					}
				},
			),
		);
	});
});
