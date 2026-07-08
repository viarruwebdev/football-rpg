import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng/mulberry32';
import { resolveShot } from '../resolveShot';
import type { ShotInput } from '../types';

const ELITE_SHOOTER: ShotInput = {
	shooter: { cardPower: 10, attribute: 18, modifiers: [], composure: 16 },
	keeper: { cardPower: 3, attribute: 9, modifiers: [], composure: 7 },
	modifierContext: {
		hasAssist: false,
		isHeaderAfterCross: false,
		hadForcedAdvance: false,
		shotZone: 'area',
		isLateralAngle: false,
		longShotsAttribute: 1,
	},
};

const ASSIST_SHOT: ShotInput = {
	shooter: { cardPower: 7, attribute: 14, modifiers: [], composure: 12 },
	keeper: { cardPower: 5, attribute: 12, modifiers: [], composure: 11 },
	modifierContext: {
		hasAssist: true,
		isHeaderAfterCross: false,
		hadForcedAdvance: false,
		shotZone: 'area',
		isLateralAngle: false,
		longShotsAttribute: 1,
	},
};

const ELITE_KEEPER: ShotInput = {
	shooter: { cardPower: 4, attribute: 10, modifiers: [], composure: 9 },
	keeper: { cardPower: 9, attribute: 17, modifiers: [], composure: 15 },
	modifierContext: {
		hasAssist: false,
		isHeaderAfterCross: false,
		hadForcedAdvance: false,
		shotZone: 'area',
		isLateralAngle: false,
		longShotsAttribute: 1,
	},
};

const ZERO_DIFFERENTIAL: ShotInput = {
	shooter: { cardPower: 5, attribute: 12, modifiers: [], composure: 10 },
	keeper: { cardPower: 5, attribute: 12, modifiers: [], composure: 10 },
	modifierContext: {
		hasAssist: false,
		isHeaderAfterCross: false,
		hadForcedAdvance: false,
		shotZone: 'area',
		isLateralAngle: false,
		longShotsAttribute: 1,
	},
};

const WEAK_SHOOTER: ShotInput = {
	shooter: { cardPower: 1, attribute: 4, modifiers: [], composure: 5 },
	keeper: { cardPower: 10, attribute: 19, modifiers: [], composure: 18 },
	modifierContext: {
		hasAssist: false,
		isHeaderAfterCross: false,
		hadForcedAdvance: false,
		shotZone: 'area',
		isLateralAngle: false,
		longShotsAttribute: 1,
	},
};

describe('resolveShot golden replay (T012)', () => {
	it('elite shooter vs mediocre keeper — seed 100', () => {
		const result = resolveShot(ELITE_SHOOTER, makeRng(100));
		expect(result).toMatchSnapshot();
	});

	it('shot with assist — seed 200', () => {
		const result = resolveShot(ASSIST_SHOT, makeRng(200));
		expect(result).toMatchSnapshot();
	});

	it('elite keeper scenario — seed 300 (expect greatSave or solidSave bias)', () => {
		const result = resolveShot(ELITE_KEEPER, makeRng(300));
		expect(result).toMatchSnapshot();
	});

	it('zero differential — seed 400', () => {
		const result = resolveShot(ZERO_DIFFERENTIAL, makeRng(400));
		expect(result).toMatchSnapshot();
	});

	it('weak shooter vs elite keeper — seed 500', () => {
		const result = resolveShot(WEAK_SHOOTER, makeRng(500));
		expect(result).toMatchSnapshot();
	});
});
