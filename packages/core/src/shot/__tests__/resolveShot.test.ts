import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng/mulberry32';
import { classifyShot } from '../classify';
import type { ShotEvent, ShotInput, ShotResult, ShotSegment } from '../index';
import { resolveShot } from '../resolveShot';

// T005 — type-level smoke: imports must resolve (red until types + index exist)
const _typeCheck: ShotResult = {
	result: 0,
	segment: 'greatSave' satisfies ShotSegment,
	events: [] satisfies ShotEvent[],
};
void _typeCheck;

const BASE_INPUT: ShotInput = {
	shooter: { cardPower: 5, attribute: 15, modifiers: [], composure: 12 },
	keeper: { cardPower: 4, attribute: 10, modifiers: [], composure: 10 },
	modifierContext: {
		hasAssist: false,
		isHeaderAfterCross: false,
		hadForcedAdvance: false,
		shotZone: 'area',
		isLateralAngle: false,
		longShotsAttribute: 1,
	},
};

describe('resolveShot', () => {
	it('produces identical results for the same seed (T001)', () => {
		const rng = makeRng(42);
		const first = resolveShot(BASE_INPUT, rng);
		const second = resolveShot(BASE_INPUT, rng);
		expect(first).toEqual(second);
	});

	it('classifies result=0 as greatSave — not a goal (T014)', () => {
		expect(classifyShot(0)).toBe('greatSave');
	});

	it('keeper with empty modifiers does not throw (T011)', () => {
		const input: ShotInput = {
			...BASE_INPUT,
			keeper: { cardPower: 5, attribute: 10, modifiers: [], composure: 10 },
		};
		expect(() => resolveShot(input, makeRng(1))).not.toThrow();
	});
});
