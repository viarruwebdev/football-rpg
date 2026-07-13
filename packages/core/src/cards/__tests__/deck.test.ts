import { attackCard, defenseCard, sharedCard } from '@football-rpg/content';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { assertDeckFloor, createCardEconomyState, drawOnPossessionChange } from '../deck';
import type { CardEconomyState, MatchSides } from '../types';

function makeRawDecks() {
	return {
		attack: Array.from({ length: 18 }, (_, i) => attackCard(3, `atk-${i}`)),
		defense: Array.from({ length: 10 }, (_, i) => defenseCard(2, `def-${i}`)),
		shared: Array.from({ length: 6 }, (_, i) => sharedCard(2, `sh-${i}`)),
	};
}

describe('assertDeckFloor', () => {
	it('lanza si attack < 14', () => {
		expect(() =>
			assertDeckFloor({
				attack: Array(13).fill(attackCard(3)),
				defense: Array(8).fill(defenseCard(2)),
				shared: [],
			}),
		).toThrow();
	});

	it('lanza si defense < 8', () => {
		expect(() =>
			assertDeckFloor({
				attack: Array(14).fill(attackCard(3)),
				defense: Array(7).fill(defenseCard(2)),
				shared: [],
			}),
		).toThrow();
	});
});

describe('createCardEconomyState', () => {
	it('devuelve estado determinista por semilla', () => {
		const decks = { home: makeRawDecks(), away: makeRawDecks() };
		const s1 = createCardEconomyState(decks, makeRng(42));
		const s2 = createCardEconomyState(decks, makeRng(42));
		expect(s1.decks.home.attack.cards.map((i) => i.instanceId)).toEqual(
			s2.decks.home.attack.cards.map((i) => i.instanceId),
		);
	});

	it('distribuye mano inicial: 5A + 2D = 7 cartas', () => {
		const decks = { home: makeRawDecks(), away: makeRawDecks() };
		const state = createCardEconomyState(decks, makeRng(42));
		const hand = state.hands.home.cards;
		expect(hand).toHaveLength(7);
		const attackInHand = hand.filter((i) => i.card.fase === 'A').length;
		const defenseInHand = hand.filter((i) => i.card.fase === 'D').length;
		expect(attackInHand).toBe(5);
		expect(defenseInHand).toBe(2);
	});

	// CE-004 (spec 005): the defense deck must NOT exhaust before the attack deck.
	// Measured as possession-of-exhaustion (when each sub-deck first hits 0 cards),
	// not end-of-match remaining counts — remaining counts are confounded by unplayed
	// cards sitting in hand and don't reflect the draw-rate race the 2-vs-1 asymmetry
	// is designed to win (see §3: "ambos relojes de agotamiento suenan a la vez, en el
	// descuento" — attack, drawing 2/possession from an 18-card deck, must hit zero at
	// or before defense, drawing 1/possession from a 10-card deck).
	// Uses the real drawOnPossessionChange draw function, not a reimplementation.
	it('CE-004: attack sub-deck exhausts at or before defense sub-deck (N=50, possession-level)', () => {
		const N = 50;
		let attackNeverAfterDefense = 0;

		for (let i = 0; i < N; i++) {
			const seed = i * 37 + 1;
			const rawDecks = {
				attack: Array.from({ length: 18 }, (_, k) => attackCard(5, `atk-${k}`)),
				defense: Array.from({ length: 10 }, (_, k) => defenseCard(5, `def-${k}`)),
				shared: Array.from({ length: 6 }, (_, k) => sharedCard(2, `sh-${k}`)),
			};
			const decks = { home: rawDecks, away: rawDecks };
			let cardEconomy: CardEconomyState = createCardEconomyState(decks, makeRng(seed + 500));

			let attacker: MatchSides = 'home';
			let atkExhaustedAt = -1;
			let defExhaustedAt = -1;
			for (let pos = 0; pos < 40; pos++) {
				cardEconomy = drawOnPossessionChange(cardEconomy, attacker);
				const defender: MatchSides = attacker === 'home' ? 'away' : 'home';
				const attackerDecks = cardEconomy.decks[attacker];
				const defenderDecks = cardEconomy.decks[defender];
				if (atkExhaustedAt === -1 && attackerDecks?.attack.cards.length === 0) {
					atkExhaustedAt = pos;
				}
				if (defExhaustedAt === -1 && defenderDecks?.defense.cards.length === 0) {
					defExhaustedAt = pos;
				}
				if (atkExhaustedAt !== -1 && defExhaustedAt !== -1) break;
				attacker = defender;
			}
			// "Not before" = attack's exhaustion possession must not come after defense's
			if (
				atkExhaustedAt !== -1 &&
				defExhaustedAt !== -1 &&
				atkExhaustedAt <= defExhaustedAt
			) {
				attackNeverAfterDefense++;
			}
		}
		// Attack exhausts at or before defense in every balanced match (the 2-vs-1 draw
		// asymmetry achieves its stated purpose: defense never runs out first)
		expect(attackNeverAfterDefense / N).toBe(1);
	});

	it('conservación por fase: deck.attack + cartas A en mano = original', () => {
		const decks = { home: makeRawDecks(), away: makeRawDecks() };
		const state = createCardEconomyState(decks, makeRng(42));
		const deckACount = state.decks.home.attack.cards.length;
		const handACount = state.hands.home.cards.filter((i) => i.card.fase === 'A').length;
		expect(deckACount + handACount).toBe(18);
	});

	it('instanceId único y determinista (formato "type:cardId#index" sobre orden pre-barajado)', () => {
		const decks = { home: makeRawDecks(), away: makeRawDecks() };
		const state = createCardEconomyState(decks, makeRng(42));
		const allInstances = [
			...state.decks.home.attack.cards,
			...state.decks.home.defense.cards,
			...state.decks.home.shared.cards,
			...state.hands.home.cards,
		];
		const ids = allInstances.map((i) => i.instanceId);
		// Todos únicos
		expect(new Set(ids).size).toBe(ids.length);
		// Formato correcto
		for (const id of ids) {
			expect(id).toMatch(/^.+#\d+$/);
		}
	});
});
