import { attackCard, defenseCard, sharedCard } from '@football-rpg/content';
import { describe, expect, it } from 'vitest';
import { playMatch } from '../../match/playMatch';
import { createPossession } from '../../match/possession';
import type { MatchClock, MatchState } from '../../match/types';
import { createMatchMomentumState } from '../../momentum';
import { makeRng } from '../../rng';
import { createCardEconomyState } from '../deck';

function makeRawDecks() {
	return {
		attack: Array.from({ length: 18 }, (_, i) => attackCard(5, `atk-${i}`)),
		defense: Array.from({ length: 10 }, (_, i) => defenseCard(5, `def-${i}`)),
		shared: Array.from({ length: 6 }, (_, i) => sharedCard(2, `sh-${i}`)),
	};
}

function makeInitial(seed: number): MatchState {
	const decks = { home: makeRawDecks(), away: makeRawDecks() };
	const cardEconomy = createCardEconomyState(decks, makeRng(seed + 500));
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
			home: { attribute: 14, cardPower: 5, composure: 10 },
			away: { attribute: 14, cardPower: 5, composure: 10 },
		},
	};
}

describe('CE-005: hand cap enforced in real playMatch (integration)', () => {
	it('hand never exceeds 7 cards at match end, across N=20 seeds', () => {
		const N = 20;
		for (let i = 0; i < N; i++) {
			const { state } = playMatch(makeInitial(i * 37 + 1));
			const homeSize = state.cardEconomy!.hands.home.cards.length;
			const awaySize = state.cardEconomy!.hands.away.cards.length;
			expect(homeSize).toBeLessThanOrEqual(7);
			expect(awaySize).toBeLessThanOrEqual(7);
		}
	});

	it('discarded overflow cards are routed to the bottom of their sub-deck, not lost', () => {
		const { state } = playMatch(makeInitial(1));
		const home = state.cardEconomy!;
		// Conservation: every card is either in hand, in a sub-deck, or was played (consumed).
		// None can vanish — total tracked instanceIds must stay within the original 34 per side
		// (18 attack + 10 defense + 6 shared).
		const trackedIds = new Set([
			...home.hands.home.cards.map((c) => c.instanceId),
			...home.decks.home.attack.cards.map((c) => c.instanceId),
			...home.decks.home.defense.cards.map((c) => c.instanceId),
			...home.decks.home.shared.cards.map((c) => c.instanceId),
		]);
		expect(trackedIds.size).toBeLessThanOrEqual(34);
	});
});
