import { describe, expect, it } from 'vitest';
import { createMatchMomentumState, detectThresholdCrossing } from '../index';
import type { MatchMomentumState, MomentumState } from '../types';

function withBar(
	match: MatchMomentumState,
	side: 'home' | 'away',
	bar: number,
): MatchMomentumState {
	return { ...match, [side]: { ...match[side], bar } };
}

function withCrossed(state: MomentumState, ...thresholds: number[]): MomentumState {
	return { ...state, crossedThresholds: new Set(thresholds as never[]) };
}

describe('detectThresholdCrossing — ±3 and ±4 (mechanical, symmetric)', () => {
	it('bar 0 -> +3 emits exactly one cardPowerBonus effect', () => {
		const before = createMatchMomentumState();
		const after = withBar(before, 'home', 3);
		const { effects } = detectThresholdCrossing(before, after, 'home');
		expect(effects).toEqual([
			{ type: 'cardPowerBonus', side: 'home', amount: 1, threshold: 3 },
		]);
	});

	it('bar 0 -> -3 emits cardPowerBonus with amount -1', () => {
		const before = createMatchMomentumState();
		const after = withBar(before, 'home', -3);
		const { effects } = detectThresholdCrossing(before, after, 'home');
		expect(effects).toEqual([
			{ type: 'cardPowerBonus', side: 'home', amount: -1, threshold: -3 },
		]);
	});

	it('bar 0 -> +4 emits both cardPowerBonus and extraCardDraw (crosses +3 and +4)', () => {
		const before = createMatchMomentumState();
		const after = withBar(before, 'home', 4);
		const { effects } = detectThresholdCrossing(before, after, 'home');
		expect(effects).toContainEqual({
			type: 'cardPowerBonus',
			side: 'home',
			amount: 1,
			threshold: 3,
		});
		expect(effects).toContainEqual({
			type: 'extraCardDraw',
			side: 'home',
			amount: 1,
			threshold: 4,
		});
		expect(effects).toHaveLength(2);
	});

	it('re-fires +4 after dropping to +2 and climbing back to +4', () => {
		// bar already at 2 with an empty crossedThresholds set — a prior reset
		// (bar < 3) would already have cleared both +3 and +4 from the set,
		// which is exactly what re-enables the re-fire below.
		const before = createMatchMomentumState();
		const activeState = { ...before.home, bar: 2 };
		const beforeMatch = { ...before, home: activeState };
		const after = withBar(beforeMatch, 'home', 4);
		const { effects } = detectThresholdCrossing(beforeMatch, after, 'home');
		expect(effects).toContainEqual({
			type: 'cardPowerBonus',
			side: 'home',
			amount: 1,
			threshold: 3,
		});
		expect(effects).toContainEqual({
			type: 'extraCardDraw',
			side: 'home',
			amount: 1,
			threshold: 4,
		});
	});

	it('does NOT re-fire +4 if it never dropped below +3 (still marked crossed)', () => {
		const before = createMatchMomentumState();
		const activeState = withCrossed({ ...before.home, bar: 4 }, 3, 4);
		const beforeMatch = { ...before, home: activeState };
		const after = withBar(beforeMatch, 'home', 4.5);
		const { effects } = detectThresholdCrossing(beforeMatch, after, 'home');
		expect(effects).toHaveLength(0);
	});

	it('fractional crossing +1.5 -> +3.5 fires the effect exactly once', () => {
		const before = withBar(createMatchMomentumState(), 'home', 1.5);
		const after = withBar(before, 'home', 3.5);
		const { effects } = detectThresholdCrossing(before, after, 'home');
		expect(effects.filter((e) => e.type === 'cardPowerBonus')).toHaveLength(1);
	});
});

describe('detectThresholdCrossing — own +5 (ownPeak)', () => {
	it('bar +4 -> +5 emits enteredTheZone and perfectPlayUnlocked', () => {
		const before = withBar(createMatchMomentumState(), 'home', 4);
		const after = withBar(before, 'home', 5);
		const { effects } = detectThresholdCrossing(before, after, 'home');
		expect(effects).toContainEqual(
			expect.objectContaining({
				type: 'enteredTheZone',
				side: 'home',
				triggeredBy: 'ownPeak',
			}),
		);
		expect(effects).toContainEqual({ type: 'perfectPlayUnlocked', side: 'home' });
	});

	it('when playerInTheZone is already filled, re-crossing +5 does not emit a second enteredTheZone but does re-emit perfectPlayUnlocked', () => {
		const filledState: MomentumState = {
			...createMatchMomentumState().home,
			bar: 4,
			playerInTheZone: { playerId: 'p1', triggeredBy: 'ownPeak' },
		};
		const before = { ...createMatchMomentumState(), home: filledState };
		const after = withBar(before, 'home', 5);
		const { effects } = detectThresholdCrossing(before, after, 'home');
		expect(effects.filter((e) => e.type === 'enteredTheZone')).toHaveLength(0);
		expect(effects).toContainEqual({ type: 'perfectPlayUnlocked', side: 'home' });
	});
});

describe('detectThresholdCrossing — rival -5 (rivalTrough)', () => {
	it('rival bar -4 -> -5 emits enteredTheZone for the benefited (opposite) side', () => {
		const before = withBar(createMatchMomentumState(), 'away', -4);
		const after = withBar(before, 'away', -5);
		const { effects } = detectThresholdCrossing(before, after, 'away');
		expect(effects).toContainEqual(
			expect.objectContaining({
				type: 'enteredTheZone',
				side: 'home',
				triggeredBy: 'rivalTrough',
			}),
		);
	});

	it('rival bar -4 -> -5 does NOT emit perfectPlayUnlocked for anyone', () => {
		const before = withBar(createMatchMomentumState(), 'away', -4);
		const after = withBar(before, 'away', -5);
		const { effects } = detectThresholdCrossing(before, after, 'away');
		expect(effects.filter((e) => e.type === 'perfectPlayUnlocked')).toHaveLength(0);
	});
});

describe('detectThresholdCrossing — Gherkin scenarios', () => {
	it('re-fires +3 and +4 after dropping below and climbing back up', () => {
		// bar already dropped to 2, so crossedThresholds is empty (a prior
		// reset cleared +3) — this re-enables the re-fire on the way back up.
		const before = createMatchMomentumState();
		const activeState = { ...before.home, bar: 2 };
		const beforeMatch = { ...before, home: activeState };
		const after = withBar(beforeMatch, 'home', 3);
		const { effects } = detectThresholdCrossing(beforeMatch, after, 'home');
		expect(effects).toContainEqual({
			type: 'cardPowerBonus',
			side: 'home',
			amount: 1,
			threshold: 3,
		});
	});

	it('bar falling to -5 does NOT unlock Jugada perfecta for anyone; grants enteredTheZone to the rival', () => {
		const before = withBar(createMatchMomentumState(), 'home', -4.5);
		const after = withBar(before, 'home', -5);
		const { effects } = detectThresholdCrossing(before, after, 'home');
		expect(effects.filter((e) => e.type === 'perfectPlayUnlocked')).toHaveLength(0);
		expect(effects).toContainEqual(
			expect.objectContaining({
				type: 'enteredTheZone',
				side: 'away',
				triggeredBy: 'rivalTrough',
			}),
		);
	});

	it('"en la zona" is won by the rival falling to -5, not by own bar', () => {
		let match = withBar(createMatchMomentumState(), 'home', 0);
		match = withBar(match, 'away', -4.5);
		const after = withBar(match, 'away', -5);
		const { effects } = detectThresholdCrossing(match, after, 'away');
		const zoneEffect = effects.find((e) => e.type === 'enteredTheZone');
		expect(zoneEffect).toMatchObject({ side: 'home', triggeredBy: 'rivalTrough' });
	});
});

describe('detectThresholdCrossing — resets (downward crossing)', () => {
	it('emits a reset for +3 when the bar drops below +3', () => {
		const activeState = withCrossed({ ...createMatchMomentumState().home, bar: 3 }, 3);
		const before = { ...createMatchMomentumState(), home: activeState };
		const after = withBar(before, 'home', 2.5);
		const { resets } = detectThresholdCrossing(before, after, 'home');
		expect(resets).toContainEqual({ side: 'home', threshold: 3 });
	});

	it('does not emit a reset if the bar stays at or above the threshold', () => {
		const activeState = withCrossed({ ...createMatchMomentumState().home, bar: 3 }, 3);
		const before = { ...createMatchMomentumState(), home: activeState };
		const after = withBar(before, 'home', 3.5);
		const { resets } = detectThresholdCrossing(before, after, 'home');
		expect(resets).toHaveLength(0);
	});
});
