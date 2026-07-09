/**
 * Golden replays for the momentum system (feature 003).
 *
 * Each test freezes a full operation log as a snapshot. A diff in CI means a
 * deliberate rule change — update the snapshot intentionally, never silently.
 *
 * Snapshots are rendered as plain objects (no opaque blobs) so reviewers can
 * read the diff and understand what changed.
 *
 * No Rng used: momentum-003 is fully deterministic.
 */

import { describe, expect, it } from 'vitest';
import type { DuelSegment } from '../../duel';
import {
	applyDuelResult,
	applyEvent,
	createMatchMomentumState,
	degradeAndDetect,
	updateMomentum,
} from '../index';
import type {
	MatchMomentumState,
	MomentumEventCause,
	MomentumSide,
	MomentumState,
	ThresholdEffect,
	ThresholdReset,
} from '../types';

// ---------------------------------------------------------------------------
// Serialization helpers — convert Set<MomentumThreshold> to sorted arrays so
// snapshots are readable JSON diffs, not [object Set].
// ---------------------------------------------------------------------------

function serializeState(state: MomentumState) {
	return {
		bar: state.bar,
		consecutiveWins: state.consecutiveWins,
		maxReached: state.maxReached,
		playsAtPeakPositive: state.playsAtPeakPositive,
		crossedThresholds: [...state.crossedThresholds].sort((a, b) => a - b),
		playerInTheZone: state.playerInTheZone,
	};
}

function serializeMatch(match: MatchMomentumState) {
	return { home: serializeState(match.home), away: serializeState(match.away) };
}

interface ReplayStep {
	op: string;
	home: ReturnType<typeof serializeState>;
	away: ReturnType<typeof serializeState>;
	effects: ThresholdEffect[];
	resets: ThresholdReset[];
}

// ---------------------------------------------------------------------------
// Replay builders
// ---------------------------------------------------------------------------

function replayEvent(
	match: MatchMomentumState,
	side: MomentumSide,
	cause: MomentumEventCause,
	log: ReplayStep[],
): MatchMomentumState {
	const barState = applyEvent(match[side], cause);
	const { match: next, effects, resets } = updateMomentum(match, side, barState);
	log.push({ op: `${side}.event(${cause})`, ...serializeMatch(next), effects, resets });
	return next;
}

function replayDuel(
	match: MatchMomentumState,
	side: MomentumSide,
	segment: DuelSegment,
	log: ReplayStep[],
): MatchMomentumState {
	const barState = applyDuelResult(match[side], segment);
	const { match: next, effects, resets } = updateMomentum(match, side, barState);
	log.push({ op: `${side}.duel(${segment})`, ...serializeMatch(next), effects, resets });
	return next;
}

function replayDegrade(
	match: MatchMomentumState,
	side: MomentumSide,
	hadEventOrWin: boolean,
	determination: number,
	log: ReplayStep[],
): MatchMomentumState {
	const {
		match: next,
		effects,
		resets,
	} = degradeAndDetect(match, side, {
		hadSignificantEventOrWin: hadEventOrWin,
		determinationAverage: determination,
	});
	log.push({
		op: `${side}.degrade(hadEvent=${hadEventOrWin},det=${determination})`,
		...serializeMatch(next),
		effects,
		resets,
	});
	return next;
}

// ---------------------------------------------------------------------------
// Sequence 1 — Escalada a +5 con cruce de los tres umbrales
// Invariant: every positive threshold fires exactly once per ascent;
//            saturation stops the bar at 5; maxReached reaches 5.
// ---------------------------------------------------------------------------

describe('replay 1 — ascent to +5 crossing all three positive thresholds', () => {
	it('matches snapshot', () => {
		const log: ReplayStep[] = [];
		let match = createMatchMomentumState();

		// Step 1: goal +2 → bar = 2
		match = replayEvent(match, 'home', 'goal', log);

		// Step 2: cleanSuccess +0.5 → bar = 2.5
		match = replayDuel(match, 'home', 'cleanSuccess', log);

		// Step 3: cleanSuccess +0.5 → bar = 3 → crosses +3 threshold (cardPowerBonus)
		match = replayDuel(match, 'home', 'cleanSuccess', log);

		// Step 4: crushingSuccess +1 → bar = 4 → crosses +4 threshold (extraCardDraw)
		match = replayDuel(match, 'home', 'crushingSuccess', log);

		// Step 5: goal +2 → bar = 5 (saturated) → crosses +5 (perfectPlayUnlocked + enteredTheZone)
		// Without saturation it would be 6; must stop at 5.
		match = replayEvent(match, 'home', 'goal', log);

		expect(log).toMatchSnapshot();
	});
});

// ---------------------------------------------------------------------------
// Sequence 2 — Full degradation from +3 down to 0, never crossing into negative
// Invariant: degradation halts at 0; maxReached is preserved at 3.
// ---------------------------------------------------------------------------

describe('replay 2 — degradation from +3 to 0, never crossing zero', () => {
	it('matches snapshot', () => {
		const log: ReplayStep[] = [];
		// Build initial state at bar=3 with threshold +3 already crossed via events
		let match = createMatchMomentumState();
		match = replayEvent(match, 'home', 'goal', log); // +2 → 2
		match = replayDuel(match, 'home', 'cleanSuccess', log); // +0.5 → 2.5
		match = replayDuel(match, 'home', 'cleanSuccess', log); // +0.5 → 3, crosses +3

		// Now degrade five times without event or win (determination < 16)
		for (let i = 0; i < 5; i++) {
			match = replayDegrade(match, 'home', false, 10, log);
		}

		expect(log).toMatchSnapshot();
	});
});

// ---------------------------------------------------------------------------
// Sequence 3 — Tide-turning goal (gol contra la marea)
// Invariant: from negative bar, goal uses +3 delta instead of +2;
//            from positive bar, normal goal uses +2.
// ---------------------------------------------------------------------------

describe('replay 3 — tide-turning goal applies +3 from negative, +2 from positive', () => {
	it('matches snapshot', () => {
		const log: ReplayStep[] = [];
		let match = createMatchMomentumState();

		// Drive home to -3 via devastating counter (-2) + disadvantaged (-1.5) → -3.5 → degrade to -3
		// simpler: two devastatingCounter (-2 each) → -4, then degrade toward 0 one step → -3
		match = replayDuel(match, 'home', 'devastatingCounter', log); // -2
		match = replayDuel(match, 'home', 'simpleLoss', log); // -1 → -3

		// tideTurningGoal from bar=-3 (negative) → +3 inversión → bar=0
		match = replayEvent(match, 'home', 'tideTurningGoal', log);

		// From bar=0 (not negative), tideTurningGoal acts as normal goal (+2) → bar=2
		match = replayEvent(match, 'home', 'tideTurningGoal', log);

		// Drive to +1 via cleanSuccess (+0.5, +0.5)
		match = replayDuel(match, 'home', 'cleanSuccess', log); // 2.5
		match = replayDuel(match, 'home', 'cleanSuccess', log); // 3 (crosses +3)
		// From bar=3 (positive), tideTurningGoal acts as normal goal (+2) → 5 (saturated, crosses +4 and +5)
		match = replayEvent(match, 'home', 'tideTurningGoal', log);

		expect(log).toMatchSnapshot();
	});
});

// ---------------------------------------------------------------------------
// Sequence 4 — Single "en la zona" slot shared by both paths
// Invariant: ownPeak fills the slot; rivalTrough cannot fill it a second time;
//            rivalTrough does NOT unlock "Jugada perfecta" for the benefited side.
// ---------------------------------------------------------------------------

describe('replay 4 — single enteredTheZone slot, rivalTrough cannot duplicate', () => {
	it('matches snapshot', () => {
		const log: ReplayStep[] = [];
		let match = createMatchMomentumState();

		// Bring home to +5 (ownPeak path)
		match = replayEvent(match, 'home', 'goal', log); // 2
		match = replayDuel(match, 'home', 'cleanSuccess', log); // 2.5
		match = replayDuel(match, 'home', 'cleanSuccess', log); // 3 → threshold +3
		match = replayDuel(match, 'home', 'crushingSuccess', log); // 4 → threshold +4
		match = replayEvent(match, 'home', 'goal', log); // 5 → threshold +5, ownPeak → zone

		// home.playerInTheZone is now set (ownPeak). Now drive away to -5 (rivalTrough).
		// rivalTrough should try to give "en la zona" to home (benefited side),
		// but home already has the slot filled — no second enteredTheZone emitted.
		// And away reaching -5 must NOT emit perfectPlayUnlocked for home (only ownPeak does that).
		match = replayEvent(match, 'away', 'goal', log); // away concedes? No — goal for away = away gets +2
		// We need away to go negative. Use simpleLoss on away's perspective:
		// away "loses" means away's bar goes down.
		match = replayDuel(match, 'away', 'devastatingCounter', log); // -2
		match = replayDuel(match, 'away', 'devastatingCounter', log); // -4 → crosses -3 and -4 (away's negatives)
		match = replayDuel(match, 'away', 'simpleLoss', log); // -4 - 1 = -5 → rivalTrough for home

		expect(log).toMatchSnapshot();
	});
});

// ---------------------------------------------------------------------------
// Sequence 5 — consecutiveWins: neutral segments don't break the streak, losses do
// Invariant: forcedAdvance and splitBall preserve consecutiveWins;
//            possessionStreak +1 fires after 3rd consecutive win;
//            simpleLoss resets to 0.
// ---------------------------------------------------------------------------

describe('replay 5 — consecutiveWins counter: neutrals preserve, losses reset', () => {
	it('matches snapshot', () => {
		const log: ReplayStep[] = [];
		let match = createMatchMomentumState();

		// cleanSuccess ×2 → consecutiveWins = 2
		match = replayDuel(match, 'home', 'cleanSuccess', log); // wins=1, bar=0.5
		match = replayDuel(match, 'home', 'cleanSuccess', log); // wins=2, bar=1.0

		// forcedAdvance → bar unchanged (0 delta), consecutiveWins stays 2
		match = replayDuel(match, 'home', 'forcedAdvance', log); // wins=2, bar=1.0

		// splitBall → bar unchanged (0 delta), consecutiveWins stays 2
		match = replayDuel(match, 'home', 'splitBall', log); // wins=2, bar=1.0

		// cleanSuccess → wins=3; possessionStreak event (+1) represents the external trigger
		// (the game engine would fire this event; here we simulate it explicitly)
		match = replayDuel(match, 'home', 'cleanSuccess', log); // wins=3, bar=1.5
		match = replayEvent(match, 'home', 'possessionStreak', log); // +1 → bar=2.5

		// simpleLoss → consecutiveWins resets to 0; bar -1 → 1.5
		match = replayDuel(match, 'home', 'simpleLoss', log); // wins=0, bar=1.5

		expect(log).toMatchSnapshot();
	});
});

// ---------------------------------------------------------------------------
// Sequence 6 — playsAtPeakPositive resets when bar leaves +5
// Invariant: counter increments only at bar===5; resets to 0 on any other value;
//            second run at +5 starts fresh from 0; maxReached stays at 5.
// ---------------------------------------------------------------------------

describe('replay 6 — playsAtPeakPositive resets when bar drops below +5', () => {
	it('matches snapshot', () => {
		const log: ReplayStep[] = [];
		let match = createMatchMomentumState();

		// Reach +5
		match = replayEvent(match, 'home', 'goal', log); // 2
		match = replayDuel(match, 'home', 'cleanSuccess', log); // 2.5
		match = replayDuel(match, 'home', 'cleanSuccess', log); // 3 → threshold +3
		match = replayDuel(match, 'home', 'crushingSuccess', log); // 4 → threshold +4
		match = replayEvent(match, 'home', 'goal', log); // 5 → threshold +5, playsAtPeak=1

		// Stay at +5 for 5 more plays (saturated events that don't change bar, but
		// playsAtPeakPositive increments each time bar stays at 5 after an op)
		// Use epicSave (+1, saturates at 5) to keep bar at 5 while ticking the counter
		match = replayEvent(match, 'home', 'epicSave', log); // bar=5, playsAtPeak=2
		match = replayEvent(match, 'home', 'epicSave', log); // bar=5, playsAtPeak=3
		match = replayEvent(match, 'home', 'epicSave', log); // bar=5, playsAtPeak=4
		match = replayEvent(match, 'home', 'epicSave', log); // bar=5, playsAtPeak=5
		match = replayEvent(match, 'home', 'epicSave', log); // bar=5, playsAtPeak=6

		// Drop to +4 via degradation (1 possession without event/win)
		match = replayDegrade(match, 'home', false, 10, log); // bar=4, playsAtPeak=0 (RESET)

		// Return to +5 — second run should start from 0
		match = replayEvent(match, 'home', 'epicSave', log); // bar=5, playsAtPeak=1
		match = replayEvent(match, 'home', 'epicSave', log); // bar=5, playsAtPeak=2

		expect(log).toMatchSnapshot();
	});
});
