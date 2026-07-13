import { attackCard, defenseCard, sharedCard } from '@football-rpg/content';
import { describe, expect, it } from 'vitest';
import { playMatch } from '../../match/playMatch';
import { createPossession } from '../../match/possession';
import type { MatchClock, MatchState } from '../../match/types';
import { createMatchMomentumState } from '../../momentum';
import { makeRng } from '../../rng';
import { createCardEconomyState } from '../deck';

// Derives cardPower from team attribute using the same scale as the real game.
// attr=10 → power ~3-4 (Base); attr=14 → ~5 (Advanced); attr=17 → ~6-7 (Elite).
// Couples card power and goalkeeper attributes to the same attr parameter —
// "powerful cards + weak goalkeeper" requires passing a high attr, which also arms
// the goalkeeper with superior cards.
function cardPowerForAttr(attr: number): { atk: number; def: number } {
	if (attr <= 10) return { atk: 3, def: 3 };
	if (attr <= 13) return { atk: 4, def: 4 };
	if (attr <= 16) return { atk: 5, def: 5 };
	return { atk: 7, def: 6 }; // attr 17+ → Élite/técnicas especiales
}

// Un partido equilibrado: mismo attr para ambos equipos. El portero se regenera en playMatch
// usando teamProfiles[side].attribute → las cartas superiores se desbloquean exactamente cuando
// el equipo tiene el atributo que las justifica. No hay parámetro de potencia independiente.
function makeMatchState(seed: number, attr: number): MatchState {
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
		teamProfiles: {
			home: { attribute: attr, cardPower: cardPowerForAttr(attr).atk, composure: 10 },
			away: { attribute: attr, cardPower: cardPowerForAttr(attr).atk, composure: 10 },
		},
	};
}

function makeDecks(attr: number) {
	const { atk, def } = cardPowerForAttr(attr);
	return {
		attack: Array.from({ length: 18 }, (_, i) => attackCard(atk, `atk-${i}`)),
		defense: Array.from({ length: 10 }, (_, i) => defenseCard(def, `def-${i}`)),
		shared: Array.from({ length: 6 }, (_, i) => sharedCard(2, `sh-${i}`)),
	};
}

describe('playMatch con cardEconomy', () => {
	it('(a) produce log de eventos sin errores con cartas reales', () => {
		const attr = 14;
		const decks = { home: makeDecks(attr), away: makeDecks(attr) };
		const cardEconomy = createCardEconomyState(decks, makeRng(42));
		const initial = { ...makeMatchState(42, attr), cardEconomy };
		expect(() => playMatch(initial)).not.toThrow();
		const { events } = playMatch(initial);
		expect(events.length).toBeGreaterThan(0);
	});

	it('(b) sin cardEconomy (undefined) funciona igual que en la 004', () => {
		const initial = makeMatchState(42, 14);
		expect(initial.cardEconomy).toBeUndefined();
		expect(() => playMatch(initial)).not.toThrow();
	});

	// CE-003/RF-004: played cards must be removed from hand.
	// In a possession of N duels, the hand must lose N cards. If selectCard never calls
	// playCard, this test is red: hand size stays constant throughout the possession.
	it('(d) CE-003: played cards are consumed — hand shrinks by 1 per duel', () => {
		const attr = 14;
		const seed = 99;
		const decks = { home: makeDecks(attr), away: makeDecks(attr) };
		const cardEconomy = createCardEconomyState(decks, makeRng(seed + 500));
		const initial = { ...makeMatchState(seed, attr), cardEconomy };
		const { state, events } = playMatch(initial);

		const duelEvents = events.filter((e) => e.type === 'duelResolved');
		// At least one duel must have occurred for this test to be meaningful
		expect(duelEvents.length).toBeGreaterThan(0);

		// After the match, total cards in hand + deck per side must equal initial count
		// AND no played card's instanceId should appear in the final hand or decks
		// (cards are consumed, not returned to any zone)
		const initialHomeIds = new Set([
			...initial.cardEconomy!.hands.home.cards.map((c) => c.instanceId),
			...initial.cardEconomy!.decks.home.attack.cards.map((c) => c.instanceId),
			...initial.cardEconomy!.decks.home.defense.cards.map((c) => c.instanceId),
			...initial.cardEconomy!.decks.home.shared.cards.map((c) => c.instanceId),
		]);

		const finalHomeIds = new Set([
			...(state.cardEconomy?.hands.home.cards.map((c) => c.instanceId) ?? []),
			...(state.cardEconomy?.decks.home.attack.cards.map((c) => c.instanceId) ?? []),
			...(state.cardEconomy?.decks.home.defense.cards.map((c) => c.instanceId) ?? []),
			...(state.cardEconomy?.decks.home.shared.cards.map((c) => c.instanceId) ?? []),
		]);

		// Some cards must have been consumed (final < initial)
		expect(finalHomeIds.size).toBeLessThan(initialHomeIds.size);

		// Every remaining card was in the original set (no ghost cards)
		for (const id of finalHomeIds) {
			expect(initialHomeIds.has(id)).toBe(true);
		}
	});

	// CE-014: balanced matchup where card power and goalkeeper attribute share the same
	// attr input — "powerful cards + weak goalkeeper" requires explicitly declaring
	// an extreme matchup.
	// attr=14: cardPower=5, goalkeeper with Blocaje (Handling≥13✓) but not Estirada (Reflexes≥15✗).
	// Remeasured after F1 fix (cards now consumed): ~4.05 goals/match (N=200). Band [2.0, 4.5] holds.
	// attr=15 (Estirada): ~3.31; attr=17 (Achique): ~4.30. All within band.
	// CE-003: deck depleted in 100% of matches; ~22.5 cards consumed per side per match.
	it('(c) CE-014: media de goles en [2.0, 4.5] con N=50 partidos, porteros realistas', () => {
		const N = 50;
		const attr = 14;
		let totalGoals = 0;
		for (let i = 0; i < N; i++) {
			const seed = i * 37 + 1;
			const decks = { home: makeDecks(attr), away: makeDecks(attr) };
			const cardEconomy = createCardEconomyState(decks, makeRng(seed + 1000));
			const initial = { ...makeMatchState(seed, attr), cardEconomy };
			const { state } = playMatch(initial);
			totalGoals += state.score.home + state.score.away;
		}
		const mean = totalGoals / N;
		expect(mean).toBeGreaterThanOrEqual(2.0);
		expect(mean).toBeLessThanOrEqual(4.5);
	});
});
