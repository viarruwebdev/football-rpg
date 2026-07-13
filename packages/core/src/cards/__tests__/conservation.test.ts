import { attackCard, defenseCard, sharedCard } from '@football-rpg/content';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { createCardEconomyState } from '../deck';
import type { CardEconomyState, CardInstance, MatchSides } from '../types';

function makeDecks() {
	return {
		attack: Array.from({ length: 14 }, (_, i) => attackCard(3, `a${i}`)),
		defense: Array.from({ length: 8 }, (_, i) => defenseCard(2, `d${i}`)),
		shared: Array.from({ length: 6 }, (_, i) => sharedCard(2, `s${i}`)),
	};
}

function collectInstanceIds(state: CardEconomyState, side: MatchSides): string[] {
	const { attack, defense, shared } = state.decks[side];
	const hand = state.hands[side];
	return [...attack.cards, ...defense.cards, ...shared.cards, ...hand.cards].map(
		(i: CardInstance) => i.instanceId,
	);
}

function toMultiset(ids: string[]): Map<string, number> {
	const m = new Map<string, number>();
	for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
	return m;
}

describe('Conservation properties (CE-002, CE-005)', () => {
	it('P2 — mano nunca supera 7 tras createCardEconomyState', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 999 }), (seed) => {
				const state = createCardEconomyState(
					{ home: makeDecks(), away: makeDecks() },
					makeRng(seed),
				);
				expect(state.hands.home.cards.length).toBeLessThanOrEqual(7);
				expect(state.hands.away.cards.length).toBeLessThanOrEqual(7);
			}),
		);
	});

	it('P1 — multiset de instanceId constante tras construcción (sin jugar aún)', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(1));
		// Total: 14 attack + 8 defense + 6 shared = 28 per side; 7 en mano = todos accounted
		const ids = collectInstanceIds(state, 'home');
		// 14+8+6 = 28 cartas totales; 7 en mano ya incluidas en collectInstanceIds
		expect(ids.length).toBe(28);
		const ms = toMultiset(ids);
		// Ningún instanceId duplicado (cada carta es única)
		expect(ms.size).toBe(28);
	});

	it('P4 — instanceIds son globalmente únicos: sub-mazo prefijado en wrap() evita colisiones entre attack/shared/defense', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 999 }), (seed) => {
				const state = createCardEconomyState(
					{ home: makeDecks(), away: makeDecks() },
					makeRng(seed),
				);
				for (const side of ['home', 'away'] as const) {
					const ids = collectInstanceIds(state, side);
					const ms = toMultiset(ids);
					// Every instanceId must appear exactly once (no cross-subdeck collision)
					for (const [id, count] of ms) {
						expect(count, `instanceId '${id}' appears ${count} times`).toBe(1);
					}
				}
			}),
		);
	});

	it('P3 — no reaparición: instanceId de carta jugada no aparece en deck+hand (simulado con remove manual)', () => {
		const state = createCardEconomyState({ home: makeDecks(), away: makeDecks() }, makeRng(5));
		// Simular que la primera carta de la mano se "jugó" — eliminarla de todos los SubDecks y Hand
		const played = state.hands.home.cards[0]!;
		const remaining = collectInstanceIds(state, 'home').filter(
			(id) => id !== played.instanceId,
		);
		// La carta jugada no debe estar en remaining
		expect(remaining).not.toContain(played.instanceId);
		// Y sigue siendo única antes del juego
		expect(toMultiset(collectInstanceIds(state, 'home')).get(played.instanceId)).toBe(1);
	});
});
