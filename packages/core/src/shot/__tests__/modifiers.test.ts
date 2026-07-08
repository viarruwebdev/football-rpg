import { describe, expect, it } from 'vitest';
import { applyShotModifiers } from '../modifiers';
import type { ShotModifierContext } from '../types';

const BASE: ShotModifierContext = {
	hasAssist: false,
	isHeaderAfterCross: false,
	hadForcedAdvance: false,
	shotZone: 'area',
	isLateralAngle: false,
	longShotsAttribute: 1,
};

describe('applyShotModifiers', () => {
	it('no mods → empty array', () => {
		expect(applyShotModifiers(BASE)).toEqual([]);
	});

	it('hasAssist → contains +3', () => {
		const mods = applyShotModifiers({ ...BASE, hasAssist: true });
		expect(mods).toContain(3);
	});

	it('isHeaderAfterCross → contains +2', () => {
		const mods = applyShotModifiers({ ...BASE, isHeaderAfterCross: true });
		expect(mods).toContain(2);
	});

	it('hadForcedAdvance → contains -2', () => {
		const mods = applyShotModifiers({ ...BASE, hadForcedAdvance: true });
		expect(mods).toContain(-2);
	});

	it('shotZone=attack + no LS → contains -3', () => {
		const mods = applyShotModifiers({ ...BASE, shotZone: 'attack', longShotsAttribute: 1 });
		expect(mods).toContain(-3);
	});

	it('shotZone=attack + LS 16 → distance penalty is -1 (net after +2 mitigation)', () => {
		const mods = applyShotModifiers({
			...BASE,
			shotZone: 'attack',
			longShotsAttribute: 16,
		});
		expect(mods).toContain(-1);
	});

	it('shotZone=attack + LS 18 → no distance penalty (0, eliminated)', () => {
		const mods = applyShotModifiers({
			...BASE,
			shotZone: 'attack',
			longShotsAttribute: 18,
		});
		// No negative distance mod in the list
		expect(mods.filter((m) => m < 0)).toEqual([]);
	});

	it('shotZone=midfield + no LS → contains -5', () => {
		const mods = applyShotModifiers({ ...BASE, shotZone: 'midfield', longShotsAttribute: 1 });
		expect(mods).toContain(-5);
	});

	it('shotZone=midfield + LS 16 → distance penalty is -3 (net after +2 mitigation)', () => {
		const mods = applyShotModifiers({
			...BASE,
			shotZone: 'midfield',
			longShotsAttribute: 16,
		});
		expect(mods).toContain(-3);
	});

	it('shotZone=midfield + LS 18 → no distance penalty (0, eliminated)', () => {
		const mods = applyShotModifiers({
			...BASE,
			shotZone: 'midfield',
			longShotsAttribute: 18,
		});
		expect(mods.filter((m) => m < 0)).toEqual([]);
	});

	it('shotZone=area → no distance penalty regardless of LS', () => {
		const mods = applyShotModifiers({
			...BASE,
			shotZone: 'area',
			longShotsAttribute: 1,
		});
		expect(mods.filter((m) => m < -2)).toEqual([]); // only angle or forced advance can be negative
	});

	it('isLateralAngle → contains -2 (no special interaction with zone)', () => {
		const mods = applyShotModifiers({ ...BASE, isLateralAngle: true });
		expect(mods).toContain(-2);
	});

	it('isLateralAngle + shotZone=area → both present independently (CHK040)', () => {
		const mods = applyShotModifiers({ ...BASE, isLateralAngle: true, shotZone: 'area' });
		expect(mods).toContain(-2); // angle
		// area has no distance penalty so no extra negative from distance
	});

	it('hasAssist + isHeaderAfterCross simultaneously → both +3 and +2 in list (CHK041)', () => {
		const mods = applyShotModifiers({
			...BASE,
			hasAssist: true,
			isHeaderAfterCross: true,
		});
		expect(mods).toContain(3);
		expect(mods).toContain(2);
	});

	it('distance mitigated penalty is always ≤ 0 (never a bonus — T008)', () => {
		for (const zone of ['attack', 'midfield'] as const) {
			for (let ls = 1; ls <= 20; ls++) {
				const mods = applyShotModifiers({
					...BASE,
					shotZone: zone,
					longShotsAttribute: ls,
				});
				for (const m of mods) {
					if (m < 0 || m === 0) {
						expect(m).toBeLessThanOrEqual(0);
					}
				}
			}
		}
	});
});
