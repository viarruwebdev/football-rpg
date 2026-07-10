import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createMatchMomentumState, createMomentumState } from '../../momentum';
import { makeRng } from '../../rng';
import { applyTransition, closePossession, createPossession } from '../possession';
import { segmentToTransition } from '../transition';
import type { MatchClock, MatchState } from '../types';

function makeClock(): MatchClock {
	return {
		playsElapsed: 0,
		phase: 'firstHalf',
		halfLength: 30,
		exactStoppageTime: 4,
		stoppageTimeVisibility: { kind: 'range', min: 4, max: 6 },
		stoppageContributions: [],
	};
}

function makeMatchState(): MatchState {
	const possession = createPossession('home');
	return {
		clock: makeClock(),
		possession,
		momentum: createMatchMomentumState(),
		score: { home: 0, away: 0 },
		rng: makeRng(42),
	};
}

describe('createPossession', () => {
	it('starts with accumulatedPressure 0 and possessionStreakEmitted false', () => {
		const p = createPossession('home');
		expect(p.accumulatedPressure).toBe(0);
		expect(p.possessionStreakEmitted).toBe(false);
		expect(p.duelsWonInPossession).toBe(0);
	});

	it('sets attackingSide correctly', () => {
		expect(createPossession('home').attackingSide).toBe('home');
		expect(createPossession('away').attackingSide).toBe('away');
	});
});

describe('applyTransition', () => {
	it('Historia 1: 4 forcedAdvance eslabones → accumulatedPressure === 3', () => {
		let possession = createPossession('home');
		const t = segmentToTransition('forcedAdvance');
		for (let i = 0; i < 4; i++) {
			possession = applyTransition(possession, t);
		}
		expect(possession.accumulatedPressure).toBe(3);
	});

	it('G1 CE-004 (property): n forcedAdvance transitions → accumulatedPressure === n-1', () => {
		fc.assert(
			fc.property(fc.integer({ min: 1, max: 30 }), (n) => {
				let possession = createPossession('home');
				const t = segmentToTransition('forcedAdvance');
				for (let i = 0; i < n; i++) {
					possession = applyTransition(possession, t);
				}
				expect(possession.accumulatedPressure).toBe(n - 1);
			}),
		);
	});

	it('crushingAdvance advances strip', () => {
		const p = createPossession('home');
		const next = applyTransition(p, segmentToTransition('crushingSuccess'));
		expect(['midfield', 'attack', 'area']).toContain(next.strip);
	});

	it('splitBall does not advance strip or change pressure', () => {
		const p = createPossession('home');
		const next = applyTransition(p, segmentToTransition('splitBall'));
		expect(next.strip).toBe(p.strip);
		expect(next.accumulatedPressure).toBe(p.accumulatedPressure);
	});

	it('NOT YET IMPLEMENTED (RF-019/RF-020): transitionBonus and zoneBoost are carried as data but never applied to the possession', () => {
		// disadvantageLoss carries transitionBonus: 2 (§6 "Transición +2 bonus") — the
		// returned possession is unchanged, the bonus is not folded into any field.
		const p1 = createPossession('home');
		const afterDisadvantage = applyTransition(p1, segmentToTransition('disadvantagedLoss'));
		expect(afterDisadvantage).toEqual(p1);

		// devastatingCounter carries zoneBoost: 3 (§6 "Salto de zona +3 bonus") — same story.
		const p2 = createPossession('home');
		const afterDevastating = applyTransition(p2, segmentToTransition('devastatingCounter'));
		expect(afterDevastating).toEqual(p2);

		// If this test starts failing because applyTransition now DOES something with
		// these bonuses, that's a deliberate feature, not a regression — update this
		// test to assert the new behaviour and remove the "not yet implemented" framing.
	});
});

describe('closePossession', () => {
	it('CE-013: closePossession with goal → consecutiveWins === 0 in momentum', () => {
		const state = makeMatchState();
		state.momentum.home = { ...createMomentumState(), consecutiveWins: 5 };
		state.momentum.away = { ...createMomentumState(), consecutiveWins: 3 };

		const { state: next } = closePossession(state, 'goal');
		expect(next.momentum.home.consecutiveWins).toBe(0);
		expect(next.momentum.away.consecutiveWins).toBe(0);
	});

	it('emits possessionEnded event', () => {
		const state = makeMatchState();
		const { events } = closePossession(state, 'turnover');
		const ended = events.find((e) => e.type === 'possessionEnded');
		expect(ended?.type).toBe('possessionEnded');
		expect(ended && 'reason' in ended ? ended.reason : undefined).toBe('turnover');
	});
});

// NOTE: RF-011 (role inversion after a steal) does NOT live in closePossession —
// closePossession never touches attackingSide. The inversion happens in
// playMatch.ts (creating the next PossessionState with the opposite side).
// See playMatch.golden.test.ts for the real coverage of that behaviour.
