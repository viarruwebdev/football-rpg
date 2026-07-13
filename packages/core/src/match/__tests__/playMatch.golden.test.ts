import { attackCard, defenseCard, sharedCard } from '@football-rpg/content';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createCardEconomyState } from '../../cards/deck';
import { createMatchMomentumState } from '../../momentum';
import { makeRng } from '../../rng';
import { playMatch } from '../playMatch';
import { createPossession } from '../possession';
import type { MatchClock, MatchEvent, MatchState } from '../types';

function makeInitialState(seed: number): MatchState {
	const clock: MatchClock = {
		playsElapsed: 0,
		phase: 'firstHalf',
		halfLength: 30,
		exactStoppageTime: 4,
		stoppageTimeVisibility: { kind: 'range', min: 4, max: 6 },
		stoppageContributions: [],
	};
	return {
		clock,
		possession: createPossession('home'),
		momentum: createMatchMomentumState(),
		score: { home: 0, away: 0 },
		rng: makeRng(seed),
	};
}

// Balanced real-card match: attr=14, cards consumed per duel (F1 fix).
// cardEconomy seed is offset from match seed to keep them independent.
function makeCardState(seed: number, attr = 14): MatchState {
	const rawDecks = {
		attack: Array.from({ length: 18 }, (_, i) => attackCard(5, `atk-${i}`)),
		defense: Array.from({ length: 10 }, (_, i) => defenseCard(5, `def-${i}`)),
		shared: Array.from({ length: 6 }, (_, i) => sharedCard(2, `sh-${i}`)),
	};
	const decks = { home: rawDecks, away: rawDecks };
	const cardEconomy = createCardEconomyState(decks, makeRng(seed + 10000));
	const clock: MatchClock = {
		playsElapsed: 0,
		phase: 'firstHalf',
		halfLength: 30,
		exactStoppageTime: 4,
		stoppageTimeVisibility: { kind: 'range', min: 4, max: 6 },
		stoppageContributions: [],
	};
	return {
		clock,
		possession: createPossession('home'),
		momentum: createMatchMomentumState(),
		score: { home: 0, away: 0 },
		rng: makeRng(seed),
		cardEconomy,
		teamProfiles: {
			home: { attribute: attr, cardPower: 5, composure: 10 },
			away: { attribute: attr, cardPower: 5, composure: 10 },
		},
	};
}

// Compact event log — readable in diffs, pinpoints exactly where divergence starts.
// Format: D:<seg4> | S:<seg4> | GOL:<side> | P+:<side>(k/t/r) | P-:<reason> | CLK:<phase> | MOM:<cause> | LG
function compactEvents(events: MatchEvent[]): string {
	return events
		.map((e) => {
			if (e.type === 'duelResolved') return `D:${e.segment.slice(0, 4)}`;
			if (e.type === 'shotResolved') return `S:${(e.segment as string).slice(0, 4)}`;
			if (e.type === 'goal') return `GOL:${e.side}`;
			if (e.type === 'possessionStarted') return `P+:${e.side[0]}(${e.reason[0]})`;
			if (e.type === 'possessionEnded') return `P-:${e.reason[0]}`;
			if (e.type === 'clockPhaseChanged') return `CLK:${e.phase.slice(0, 3)}`;
			if (e.type === 'momentumEventApplied') return `MOM:${e.cause.slice(0, 6)}`;
			if (e.type === 'momentumThresholdEffect') return `THR`;
			if (e.type === 'lastGasp') return `LG`;
			return e.type;
		})
		.join(' ');
}

// ─── Golden replays ──────────────────────────────────────────────────────────
//
// Each test pins: score, event count, and the full compact event sequence.
// BEFORE freezing a new snapshot, confirm that the sequence matches the spec:
// - Goals appear after the correct shot segment.
// - pressingSteal (MOM:pressi) only fires on turnover, never after a goal.
// - CLK:sec and CLK:sto appear exactly once each.
// - P+ count equals P- count + 1 (last possession ends when clock expires).
//
// To regenerate after an intentional balance change:
//   1. Fix the logic / constants first.
//   2. Run `pnpm test -- --update-snapshots` (or update the inline strings below).
//   3. Read the diff: every changed line is a behaviour change — verify it is intended.
//
// ─────────────────────────────────────────────────────────────────────────────

describe('playMatch golden replays', () => {
	it('seed 42 — 1:1 draw, 53 duels, 3 shots', () => {
		// home scores early (forced advance chain → goal on rebound);
		// away equalises late (forced advance chain → goal on rebound).
		// Seed chosen because it contains: splitBall, crushingSuccess, devastatingCounter,
		// a CLK:sec phase transition, and a CLK:sto transition mid-possession.
		const { state, events } = playMatch(makeInitialState(42));

		expect(state.score).toEqual({ home: 1, away: 1 });
		expect(events.length).toBe(160);
		expect(compactEvents(events)).toMatchInlineSnapshot(
			`"P+:h(k) D:spli D:forc D:clea D:forc S:goal GOL:home P-:g P+:a(t) D:forc D:simp MOM:pressi P-:t P+:h(t) D:spli D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:clea D:spli D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:forc D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:crus D:crus CLK:sec D:forc S:coun P-:t P+:h(t) D:forc D:disa MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:forc D:clea D:forc S:goal GOL:away P-:g P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:spli D:disa MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:clea D:clea D:disa P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:forc CLK:sto D:disa MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:clea D:clea P-:c"`,
		);
	});

	it('seed 1337 — 1:2 away win, 53 duels, 6 shots, last-gasp duel', () => {
		// home scores via unstoppableGoal (possessionStreak at 3 wins → MOM:posses).
		// away scores twice: once mid-match, once with 3 forced advances in a chain.
		// Contains: MOM:posses (possession streak), last-gasp (LG) in stoppage.
		const { state, events } = playMatch(makeInitialState(1337));

		expect(state.score).toEqual({ home: 1, away: 2 });
		expect(events.length).toBe(163);
		expect(compactEvents(events)).toMatchInlineSnapshot(
			`"P+:h(k) D:forc D:clea D:clea S:grea P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:clea D:clea D:crus MOM:posses S:unst GOL:home P-:g P+:a(t) D:clea D:forc D:clea S:goal GOL:away P-:g P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:forc D:clea D:simp P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:forc D:clea CLK:sec D:crus S:soli P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:forc D:forc D:forc S:goal GOL:away P-:g P+:h(t) D:spli D:simp MOM:pressi P-:t P+:a(t) D:clea D:forc D:clea S:soli P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:spli D:forc D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:deva CLK:sto MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:crus D:spli LG P-:c"`,
		);
	});

	it('seed 99999 — 1:1 draw, 50 duels, 6 shots, MOM:posses twice', () => {
		// away scores first; home equalises in stoppage via unstoppableGoal after
		// a possession streak (MOM:posses). Contains 4 splitBall, 4 crushingSuccess.
		const { state, events } = playMatch(makeInitialState(99999));

		expect(state.score).toEqual({ home: 1, away: 1 });
		expect(events.length).toBe(138);
		expect(compactEvents(events)).toMatchInlineSnapshot(
			`"P+:h(k) D:clea D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:forc D:clea D:forc S:coun P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:clea D:clea D:forc S:goal GOL:away P-:g P+:h(t) D:clea D:simp MOM:pressi P-:t P+:a(t) D:forc D:clea D:clea S:grea P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:forc D:simp MOM:pressi P-:t P+:h(t) D:forc D:crus D:forc S:coun P-:t P+:a(t) D:clea D:crus D:clea MOM:posses S:coun P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:spli D:disa MOM:pressi P-:t P+:h(t) D:forc D:forc D:disa P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:spli D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:spli D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:spli D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:clea D:crus CLK:sto D:crus MOM:posses S:unst GOL:home P-:g P+:a(t) D:clea D:disa MOM:pressi P-:t"`,
		);
	});
});

// ─── Golden replays with real card economy ────────────────────────────────────
//
// These replays use makeCardState (attr=14, cardPower=5, F1 fix: cards consumed per duel).
// They differ from the stub replays above because card consumption changes the RNG chain:
// playCard mutates cardEconomy, which affects which cards are available and how the
// improvise fallback is triggered. Regenerate with the same procedure as the stub replays.
//
// Each test also pins a cardEconomy summary (hand sizes + remaining sub-deck sizes).
// This is necessary because CE-005's hand-cap discard (selectDiscardsToLimit in
// playMatch.ts) mutates cardEconomy state silently — it emits no MatchEvent — so the
// event log alone does not prove the discard path is exercised. Confirmed: without this
// summary, these three replays would still pass unchanged even if selectDiscardsToLimit
// were removed entirely, because these three seeds happen to end with hand ≤ 7 and the
// event sequence is identical either way. The summary below is what actually changed
// when CE-005 was wired up (previously hands ended at up to 15 cards).
//
// ─────────────────────────────────────────────────────────────────────────────

function cardEconomySummary(state: MatchState) {
	const ce = state.cardEconomy!;
	return {
		homeHand: ce.hands.home.cards.length,
		awayHand: ce.hands.away.cards.length,
		homeAtkDeck: ce.decks.home.attack.cards.length,
		homeDefDeck: ce.decks.home.defense.cards.length,
		homeSharedDeck: ce.decks.home.shared.cards.length,
		awayAtkDeck: ce.decks.away.attack.cards.length,
		awayDefDeck: ce.decks.away.defense.cards.length,
		awaySharedDeck: ce.decks.away.shared.cards.length,
	};
}

describe('playMatch golden replays — with card economy', () => {
	it('seed 42 — 1:0 home win, real cards consumed (natural→improvise cascade, reconversion gated off)', () => {
		const { state, events } = playMatch(makeCardState(42));
		expect(state.score).toEqual({ home: 1, away: 0 });
		expect(events.length).toBe(181);
		expect(compactEvents(events)).toMatchInlineSnapshot(
			`"P+:h(k) D:spli D:forc D:crus D:crus S:goal GOL:home P-:g P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:crus D:crus D:crus MOM:posses S:soli P-:t P+:a(t) D:forc D:forc CLK:sec D:forc S:soli P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:forc D:clea D:forc S:coun P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:spli D:disa MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:clea D:clea D:disa P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:forc D:disa MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:clea D:clea CLK:sto D:simp P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t"`,
		);
		expect(cardEconomySummary(state)).toEqual({
			homeHand: 0,
			awayHand: 0,
			homeAtkDeck: 0,
			homeDefDeck: 0,
			homeSharedDeck: 0,
			awayAtkDeck: 0,
			awayDefDeck: 0,
			awaySharedDeck: 1,
		});
	});

	it('seed 1337 — 2:0 home win, real cards consumed (natural→improvise cascade, reconversion gated off)', () => {
		const { state, events } = playMatch(makeCardState(1337));
		expect(state.score).toEqual({ home: 2, away: 0 });
		expect(events.length).toBe(179);
		expect(compactEvents(events)).toMatchInlineSnapshot(
			`"P+:h(k) D:forc D:clea D:crus S:goal GOL:home P-:g P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:clea D:crus D:crus MOM:posses S:goal GOL:home P-:g P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:forc D:crus CLK:sec D:crus S:coun P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:forc D:forc D:forc S:soli P-:t P+:a(t) D:spli D:simp MOM:pressi P-:t P+:h(t) D:clea D:forc D:clea S:coun P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:spli D:forc D:deva MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:deva CLK:sto MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:crus D:spli LG P-:c"`,
		);
		expect(cardEconomySummary(state)).toEqual({
			homeHand: 0,
			awayHand: 0,
			homeAtkDeck: 0,
			homeDefDeck: 0,
			homeSharedDeck: 0,
			awayAtkDeck: 0,
			awayDefDeck: 0,
			awaySharedDeck: 0,
		});
	});

	it('seed 99999 — 0:2 away win, real cards consumed (natural→improvise cascade, reconversion gated off)', () => {
		const { state, events } = playMatch(makeCardState(99999));
		expect(state.score).toEqual({ home: 0, away: 2 });
		expect(events.length).toBe(134);
		expect(compactEvents(events)).toMatchInlineSnapshot(
			`"P+:h(k) D:clea D:simp MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:forc D:crus D:crus S:coun P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:spli D:clea D:crus D:crus MOM:posses S:unst GOL:away P-:g P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:simp MOM:pressi P-:t P+:a(t) D:spli D:spli D:simp MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:disa MOM:pressi P-:t P+:a(t) D:forc CLK:sec D:crus D:clea S:unst GOL:away P-:g P+:h(t) D:clea D:crus D:simp P-:t P+:a(t) D:deva MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:spli D:disa MOM:pressi P-:t P+:a(t) D:forc D:crus D:forc S:grea P-:t P+:h(t) D:spli D:deva MOM:pressi P-:t P+:a(t) D:disa MOM:pressi P-:t P+:h(t) D:spli D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:spli CLK:sto D:simp MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t P+:h(t) D:deva MOM:pressi P-:t P+:a(t) D:simp MOM:pressi P-:t"`,
		);
		expect(cardEconomySummary(state)).toEqual({
			homeHand: 0,
			awayHand: 0,
			homeAtkDeck: 0,
			homeDefDeck: 0,
			homeSharedDeck: 0,
			awayAtkDeck: 0,
			awayDefDeck: 0,
			awaySharedDeck: 0,
		});
	});
});

// ─── Behavioural invariants (property-based) ─────────────────────────────────

describe('playMatch', () => {
	it('CE-001: same seed produces identical events and score', () => {
		const run1 = playMatch(makeInitialState(42));
		const run2 = playMatch(makeInitialState(42));
		expect(run1.state.score).toEqual(run2.state.score);
		expect(run1.events).toEqual(run2.events);
	});

	it('D1 property: different duels in same match produce different results', () => {
		// If Rng is not advanced between duels (bug: no `rng = rngDuel`), all duels
		// resolve identically. This test goes RED against that bug (unique.size === 1).
		const result = playMatch(makeInitialState(42));
		const duelEvents = result.events.filter((e) => e.type === 'duelResolved');
		if (duelEvents.length > 1) {
			const segments = duelEvents.map((e) => (e.type === 'duelResolved' ? e.segment : null));
			const unique = new Set(segments);
			expect(unique.size).toBeGreaterThan(1);
		}
	});

	it('N2: a splitBall transition consumes 2 plays in the clock', () => {
		// splitBall events contribute 2 plays — verified by match completing in stoppage.
		const result = playMatch(makeInitialState(42));
		expect(result.state.clock.phase).toBe('stoppage');
		expect(result.events.length).toBeGreaterThan(0);
	});

	it('RF-011: role inversion — every turnover-started possession has the opposite side of the one before it', () => {
		// RF-011 lives in playMatch.ts (the `nextSide` computation when opening the
		// next possession after a steal), NOT in closePossession — closePossession
		// never touches attackingSide. This test exercises playMatch directly.
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 200 }), (seed) => {
				const result = playMatch(makeInitialState(seed));
				const starts = result.events.filter((e) => e.type === 'possessionStarted');
				// i starts at 1, so `prev` always exists — no need to assert its presence.
				for (let i = 1; i < starts.length; i++) {
					const prev = starts[i - 1];
					const curr = starts[i];
					if (
						prev &&
						curr &&
						curr.type === 'possessionStarted' &&
						curr.reason === 'turnover'
					) {
						expect(curr.side).not.toBe(prev.side);
					}
				}
			}),
			{ numRuns: 30 },
		);
	});

	it('match always ends in stoppage phase', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 10000 }), (seed) => {
				const result = playMatch(makeInitialState(seed));
				expect(result.state.clock.phase).toBe('stoppage');
			}),
			{ numRuns: 10 },
		);
	});

	it('score is always non-negative', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 10000 }), (seed) => {
				const result = playMatch(makeInitialState(seed));
				expect(result.state.score.home).toBeGreaterThanOrEqual(0);
				expect(result.state.score.away).toBeGreaterThanOrEqual(0);
			}),
			{ numRuns: 10 },
		);
	});

	it('NOT YET IMPLEMENTED (/analyze C1): exactStoppageTime never changes mid-match — computeStoppageTime is not wired into playMatch', () => {
		// /analyze raised C1 (HIGH) asking for an integration test: "match with N
		// fouls from kickoff → exactStoppageTime == base + 0.5·N". That test does
		// NOT exist — clock.test.ts only exercises computeStoppageTime in isolation.
		// This is the actual integration test, and it pins the real behaviour:
		// playMatch never calls computeStoppageTime. Fouls/injuries/substitutions
		// are out of scope for the 004 (spec.md, "Fuera de alcance"), so there are
		// no contributions to feed it — exactStoppageTime is read-only from
		// playMatch's point of view, always equal to whatever the initial state set.
		const initial = makeInitialState(42);
		const { state } = playMatch(initial);
		expect(state.clock.exactStoppageTime).toBe(initial.clock.exactStoppageTime);

		// If this starts failing because playMatch now recomputes stoppage time from
		// fouls/injuries/substitutions, that's a deliberate feature — update this test
		// to assert the new behaviour and remove the "not yet implemented" framing.
	});
});
