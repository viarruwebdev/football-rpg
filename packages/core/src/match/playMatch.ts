import type {
	CardEconomyState,
	CardInstance,
	GoalkeeperCardId,
	GoalkeeperSet,
	ImprovisedIntent,
	MatchSides,
	PlayedCard,
} from '../cards';
import {
	applyRetreat,
	canConvert,
	cardToDuelSide,
	cardToShotSide,
	convertCard,
	discardToLimit,
	drawOnCrushingSuccess,
	drawOnPossessionChange,
	getEffect,
	improviseCard,
	mulligan,
	playCard,
	regenerateGoalkeeperSet,
	useGoalkeeperCard,
} from '../cards';
import type { DuelInput, DuelSegment } from '../duel';
import { resolveDuel } from '../duel';
import type { MomentumSide } from '../momentum';
import { applyDuelResult, applyEvent, shotSegmentToMomentumCause } from '../momentum';
import type { ShotInput } from '../shot';
import { resolveShot } from '../shot';
import { advanceClock } from './clock';
import { handleClockExpiry } from './endgame';
import {
	buildSituationalModifiers,
	emitPossessionStreak,
	emitPressingSteal,
} from './momentumWiring';
import { applyTransition, closePossession, createPossession } from './possession';
import { segmentToTransition } from './transition';
import type { MatchClock, MatchEvent, MatchState, Strip } from './types';

const MAX_POSSESSIONS = 200;

const DEFAULT_PROFILE = { attribute: 10, cardPower: 5, composure: 10 };

function makeStubDuelInput(
	mods: number[],
	attackProfile = DEFAULT_PROFILE,
	defenseProfile = DEFAULT_PROFILE,
): DuelInput {
	return {
		attack: {
			cardPower: attackProfile.cardPower,
			attribute: attackProfile.attribute,
			modifiers: mods,
			composure: attackProfile.composure,
		},
		defense: {
			cardPower: defenseProfile.cardPower,
			attribute: defenseProfile.attribute,
			modifiers: [],
			composure: defenseProfile.composure,
		},
	};
}

function makeStubShotInput(
	shooterProfile = DEFAULT_PROFILE,
	keeperProfile = DEFAULT_PROFILE,
): ShotInput {
	return {
		shooter: {
			cardPower: shooterProfile.cardPower,
			attribute: shooterProfile.attribute,
			modifiers: [],
			composure: shooterProfile.composure,
		},
		keeper: {
			cardPower: keeperProfile.cardPower,
			attribute: keeperProfile.attribute,
			modifiers: [],
			composure: keeperProfile.composure,
		},
		modifierContext: {
			hasAssist: false,
			isHeaderAfterCross: false,
			hadForcedAdvance: false,
			shotZone: 'area',
			isLateralAngle: false,
			longShotsAttribute: 10,
		},
	};
}

// PLACEHOLDER — replaceable by the decision AI (RF-027). Lives in playMatch, NOT in cards/.
// Picks the highest-potencia available goalkeeper card. Tie → first in list.
function selectGoalkeeperCard(set: GoalkeeperSet): GoalkeeperCardId {
	const candidates = set.available
		.filter(
			(c) =>
				c.id === 'parada-basica' || !set.usedThisPossession.has(c.id as GoalkeeperCardId),
		)
		.sort((a, b) => b.potencia - a.potencia);
	return (candidates[0]?.id ?? 'parada-basica') as GoalkeeperCardId;
}

// PLACEHOLDER — replaceable by the decision AI (RF-027). Lives in playMatch, NOT in cards/.
// Picks the lowest-potencia cards in hand to discard down to 7 (RF-005/RF-009: keep the best).
function selectDiscardsToLimit(cardEconomy: CardEconomyState, side: MatchSides): CardEconomyState {
	const hand = cardEconomy.hands[side]!;
	const overflow = hand.cards.length - 7;
	if (overflow <= 0) return cardEconomy;
	const chosen = [...hand.cards]
		.sort((a, b) => {
			if (a.card.potencia !== b.card.potencia) return a.card.potencia - b.card.potencia;
			return a.instanceId < b.instanceId ? -1 : 1;
		})
		.slice(0, overflow);
	return discardToLimit(cardEconomy, side, chosen);
}

// The natural attribute an improvised/converted action uses in each strip (§3 "Jugar sin
// cartas de la fase actual"). Attack/midfield default to the shot intent (Finishing) — the
// manual leaves cross-vs-shot to player choice; the decision AI placeholder always shoots.
function naturalAttributeForStrip(strip: Strip): string {
	if (strip === 'defense') return 'Tackling';
	if (strip === 'midfield') return 'Passing';
	return 'Finishing'; // attack, area
}

function improviseIntentForStrip(strip: Strip): ImprovisedIntent {
	if (strip === 'defense') return 'tackle';
	if (strip === 'midfield') return 'pass';
	return 'shot'; // attack, area
}

// PLACEHOLDER — replaceable by the decision AI (RF-027). Lives in playMatch, NOT in cards/.
// RF-004/RF-016/RF-017/RF-018: the §3 decision cascade for the action card — natural card
// of the current phase → [reconvert, only if allowReconvert] a potencia≥2 card from the
// other phase → improvise. Tie-break within a tier: highest potencia, then lower instanceId.
//
// allowReconvert defaults to false: whether to reconvert is a tactical trade-off ("¿vale la
// pena quemar esta carta que quizá necesite en su fase natural?", §3) that belongs to the
// RF-027 decision AI, not to this placeholder. An always-reconvert placeholder is a specific
// bad strategy (compulsive reconversion drains the hand faster than the phase-mismatch it
// tries to fix, worse than just improvising) — it would bias CE-014 to measure that strategy
// instead of the engine. convertCard/canConvert stay wired and reachable via this parameter
// so RF-027 can turn reconversion on without any further rewiring of selectCard's call sites.
function selectCard(
	cardEconomy: CardEconomyState,
	side: string,
	strip: Strip,
	allowReconvert = false,
): { economy: CardEconomyState; played: PlayedCard } {
	const hand = cardEconomy.hands[side as MatchSides]!;
	const targetFase = strip === 'defense' ? 'D' : 'A';
	const otherFase = strip === 'defense' ? 'A' : 'D';

	const natural = hand.cards
		.filter((c: CardInstance) => c.card.fase === targetFase || c.card.fase === 'A/D')
		.sort((a: CardInstance, b: CardInstance) => {
			if (b.card.potencia !== a.card.potencia) return b.card.potencia - a.card.potencia;
			return a.instanceId < b.instanceId ? -1 : 1;
		})[0];

	if (natural) {
		const { hand: newHand, played } = playCard(hand, natural);
		return {
			economy: {
				...cardEconomy,
				hands: { ...cardEconomy.hands, [side as MatchSides]: newHand },
			},
			played,
		};
	}

	// No natural card — reconversion (RF-018) is an RF-027 decision, gated by allowReconvert.
	if (allowReconvert) {
		const reconvertible = hand.cards
			.filter((c: CardInstance) => c.card.fase === otherFase && canConvert(c.card))
			.sort((a: CardInstance, b: CardInstance) => {
				if (b.card.potencia !== a.card.potencia) return b.card.potencia - a.card.potencia;
				return a.instanceId < b.instanceId ? -1 : 1;
			})[0];

		if (reconvertible) {
			const { hand: newHand } = playCard(hand, reconvertible);
			const played = convertCard(reconvertible.card, naturalAttributeForStrip(strip));
			return {
				economy: {
					...cardEconomy,
					hands: { ...cardEconomy.hands, [side as MatchSides]: newHand },
				},
				played,
			};
		}
	}

	// No natural (and no reconversion attempted or available) — improvise, no card spent.
	return {
		economy: cardEconomy,
		played: improviseCard(strip, improviseIntentForStrip(strip)),
	};
}

// PLACEHOLDER — replaceable by the decision AI (RF-027).
// RF-019: instants are played in the duel's pre-reveal phase, max 1 per side per duel,
// additional to the action card (they never replace it). Picks the highest-potencia
// instant (fase 'I') in hand, if any, plays it, and applies its registered effect.
function selectInstant(cardEconomy: CardEconomyState, side: MatchSides): CardEconomyState {
	const hand = cardEconomy.hands[side]!;
	const instant = [...hand.cards]
		.filter((c) => c.card.fase === 'I')
		.sort((a, b) => {
			if (b.card.potencia !== a.card.potencia) return b.card.potencia - a.card.potencia;
			return a.instanceId < b.instanceId ? -1 : 1;
		})[0];
	if (!instant) return cardEconomy;
	const { hand: newHand } = playCard(hand, instant);
	const economy: CardEconomyState = {
		...cardEconomy,
		hands: { ...cardEconomy.hands, [side]: newHand },
	};
	return getEffect(instant.card.efectoId)(economy);
}

// PLACEHOLDER — replaceable by the decision AI (RF-027).
// RF-011: mulligan at the start of a possession, before the duel chain, if the attacker's
// hand has no natural card of the phase it is about to need and hasn't mulliganed yet
// this possession.
function selectMulligan(
	cardEconomy: CardEconomyState,
	side: MatchSides,
	phase: 'attack' | 'defense' | 'shared',
): CardEconomyState {
	if (cardEconomy.mulliganUsedThisPossession[side]) return cardEconomy;
	const targetFase = phase === 'defense' ? 'D' : 'A';
	const hand = cardEconomy.hands[side]!;
	const hasNatural = hand.cards.some((c) => c.card.fase === targetFase || c.card.fase === 'A/D');
	if (hasNatural) return cardEconomy;
	const discarded = [...hand.cards]
		.sort((a, b) => {
			if (a.card.potencia !== b.card.potencia) return a.card.potencia - b.card.potencia;
			return a.instanceId < b.instanceId ? -1 : 1;
		})
		.slice(0, 2);
	if (discarded.length === 0) return cardEconomy;
	return mulligan(cardEconomy, side, discarded, phase);
}

// PLACEHOLDER — replaceable by the decision AI (RF-027).
// RF-020: retreat before the rival's possession starts, if pressure accumulated against
// this side is high (a disadvantaged transition) and a card is available to spend.
function selectRetreat(cardEconomy: CardEconomyState, side: MatchSides): CardEconomyState {
	if (cardEconomy.retreatUsedThisPossession[side]) return cardEconomy;
	const hand = cardEconomy.hands[side]!;
	const cheapest = [...hand.cards].sort((a, b) => a.card.potencia - b.card.potencia)[0];
	if (!cheapest) return cardEconomy;
	return applyRetreat(cardEconomy, side, cheapest);
}

function isClockExpired(clock: MatchClock): boolean {
	if (clock.phase !== 'stoppage') return false;
	return clock.playsElapsed >= clock.exactStoppageTime;
}

export function playMatch(initial: MatchState): { state: MatchState; events: MatchEvent[] } {
	let state: MatchState = {
		...initial,
		possession: createPossession('home'),
		score: { home: 0, away: 0 },
	};
	const allEvents: MatchEvent[] = [];

	allEvents.push({ type: 'possessionStarted', side: 'home', reason: 'kickoff' });

	// Regenerate goalkeeper sets for initial possession
	if (state.cardEconomy) {
		const defSide: MomentumSide = state.possession.attackingSide === 'home' ? 'away' : 'home';
		const defAttr = state.teamProfiles?.[defSide]?.attribute ?? 10;
		const defAttrs = {
			reflexes: defAttr,
			handling: defAttr,
			aerialReach: defAttr,
			oneOnOnes: defAttr,
		};
		const newSet = regenerateGoalkeeperSet(defAttrs);
		state = {
			...state,
			cardEconomy: {
				...state.cardEconomy,
				goalkeeperSets: { ...state.cardEconomy.goalkeeperSets, [defSide]: newSet },
			},
		};
	}

	let possessionCount = 0;

	while (!isClockExpired(state.clock) && possessionCount < MAX_POSSESSIONS) {
		possessionCount++;

		let possession = state.possession;
		let momentum = state.momentum;
		let clock = state.clock;
		let score = state.score;
		let rng = state.rng;
		let cardEconomy = state.cardEconomy;
		let lastGaspUsed = state.lastGaspUsed ?? false;
		let possessionEnded = false;
		let possessionReason: 'goal' | 'turnover' | 'clockExpired' = 'clockExpired';
		let lastGaspGranted = false;

		// RF-011: mulligan at the start of possession, before the duel chain.
		if (cardEconomy) {
			const defSideAtStart: MomentumSide =
				possession.attackingSide === 'home' ? 'away' : 'home';
			cardEconomy = selectMulligan(cardEconomy, possession.attackingSide, 'attack');
			cardEconomy = selectMulligan(cardEconomy, defSideAtStart, 'defense');
		}

		let maxDuelsInPossession = 12;

		while (!possessionEnded && maxDuelsInPossession-- > 0) {
			// Check clock expiry
			if (isClockExpired(clock)) {
				const expiry = handleClockExpiry({
					...state,
					clock,
					possession,
					momentum,
					score,
					rng,
					lastGaspUsed,
				});
				for (const e of expiry.events) allEvents.push(e);
				if (expiry.events.some((e) => e.type === 'lastGasp') && !lastGaspGranted) {
					lastGaspGranted = true;
					lastGaspUsed = true;
					rng = expiry.state.rng;
					// Allow one more duel (last gasp)
					maxDuelsInPossession = 1;
					continue;
				}
				possessionReason = 'clockExpired';
				possessionEnded = true;
				break;
			}

			// At 'area': resolve shot
			if (possession.strip === 'area') {
				// D1: split to get shot rng, advance parent to the child
				const rngShot = rng.split();
				rng = rngShot;

				const shooterProfile = state.teamProfiles?.[possession.attackingSide];
				const keeperSide: MomentumSide =
					possession.attackingSide === 'home' ? 'away' : 'home';
				const keeperProfile = state.teamProfiles?.[keeperSide];

				let shotInput: ShotInput;
				if (cardEconomy) {
					const shooterResult = selectCard(
						cardEconomy,
						possession.attackingSide,
						'attack',
					);
					cardEconomy = shooterResult.economy;
					const shooterCard = shooterResult.played;
					const keeperSet = cardEconomy.goalkeeperSets[keeperSide]!;
					const keeperResult = useGoalkeeperCard(
						keeperSet,
						selectGoalkeeperCard(keeperSet),
					);
					if (keeperResult) {
						cardEconomy = {
							...cardEconomy,
							goalkeeperSets: {
								...cardEconomy.goalkeeperSets,
								[keeperSide]: keeperResult.set,
							},
						};
					}
					const keeperCard: PlayedCard = keeperResult
						? {
								kind: 'natural',
								card: keeperResult.card as unknown as import('../cards').PlayedCardSource,
							}
						: {
								kind: 'improvised',
								power: 0,
								intent: 'tackle',
								naturalAttribute: 'Reflexes',
							};
					const shooterAttr = shooterProfile?.attribute ?? DEFAULT_PROFILE.attribute;
					const keeperAttr = keeperProfile?.attribute ?? DEFAULT_PROFILE.attribute;
					shotInput = {
						shooter: cardToShotSide(
							shooterCard,
							shooterAttr,
							shooterProfile?.composure ?? DEFAULT_PROFILE.composure,
							[],
						),
						keeper: cardToShotSide(
							keeperCard,
							keeperAttr,
							keeperProfile?.composure ?? DEFAULT_PROFILE.composure,
							[],
						),
						modifierContext: {
							hasAssist: false,
							isHeaderAfterCross: false,
							hadForcedAdvance: false,
							shotZone: possession.strip === 'area' ? 'area' : 'attack',
							isLateralAngle: false,
							longShotsAttribute: shooterAttr,
						},
					};
				} else {
					shotInput = makeStubShotInput(shooterProfile, keeperProfile);
				}
				const shotResult = resolveShot(shotInput, rngShot);
				allEvents.push({ type: 'shotResolved', segment: shotResult.segment });

				const cause = shotSegmentToMomentumCause(shotResult.segment);
				if (cause !== null) {
					const defendingSide: MomentumSide =
						possession.attackingSide === 'home' ? 'away' : 'home';
					const updatedSide = applyEvent(momentum[defendingSide], cause);
					momentum = { ...momentum, [defendingSide]: updatedSide };
				}

				clock = advanceClock(clock, 'shot');

				const isGoal =
					shotResult.segment === 'goal' ||
					shotResult.segment === 'goalOnRebound' ||
					shotResult.segment === 'unstoppableGoal';

				if (isGoal) {
					score = {
						...score,
						[possession.attackingSide]: score[possession.attackingSide] + 1,
					};
					allEvents.push({ type: 'goal', side: possession.attackingSide });
					possessionReason = 'goal';
				} else {
					possessionReason = 'turnover';
				}
				possessionEnded = true;
				break;
			}

			// Normal duel
			const mods = buildSituationalModifiers(
				possession.accumulatedPressure,
				momentum[possession.attackingSide].bar,
			);
			const attackProfile = state.teamProfiles?.[possession.attackingSide];
			const defSide: MomentumSide = possession.attackingSide === 'home' ? 'away' : 'home';
			const defProfile = state.teamProfiles?.[defSide];

			let duelInput: DuelInput;
			if (cardEconomy) {
				// RF-019: instants are played in the duel's pre-reveal phase, before the
				// action card — max 1 per side per duel, additional to the action card.
				cardEconomy = selectInstant(cardEconomy, possession.attackingSide);
				cardEconomy = selectInstant(cardEconomy, defSide);

				const atkResult = selectCard(
					cardEconomy,
					possession.attackingSide,
					possession.strip as Strip,
				);
				cardEconomy = atkResult.economy;
				const defResult = selectCard(cardEconomy, defSide, 'defense');
				cardEconomy = defResult.economy;
				const atkCard = atkResult.played;
				const defCard = defResult.played;
				const atkAttr = attackProfile?.attribute ?? DEFAULT_PROFILE.attribute;
				const defAttr = defProfile?.attribute ?? DEFAULT_PROFILE.attribute;
				duelInput = {
					attack: cardToDuelSide(
						atkCard,
						atkAttr,
						attackProfile?.composure ?? DEFAULT_PROFILE.composure,
						mods,
					),
					defense: cardToDuelSide(
						defCard,
						defAttr,
						defProfile?.composure ?? DEFAULT_PROFILE.composure,
						[],
					),
				};
			} else {
				duelInput = makeStubDuelInput(mods, attackProfile, defProfile);
			}

			// D1: split and advance Rng — each duel uses a different Rng derived by chaining splits
			const rngDuel = rng.split();
			rng = rngDuel;

			const duelResult = resolveDuel(duelInput, rngDuel);
			const segment: DuelSegment = duelResult.segment;
			const transition = segmentToTransition(segment);

			allEvents.push({ type: 'duelResolved', segment, transition });

			// Apply momentum from duel result
			const updatedSide = applyDuelResult(momentum[possession.attackingSide], segment);
			momentum = { ...momentum, [possession.attackingSide]: updatedSide };

			// Apply possession transition
			possession = applyTransition(possession, transition);

			// RF-012/CE-011: crushing success draws 1 card for the attacker
			if (segment === 'crushingSuccess' && cardEconomy) {
				cardEconomy = drawOnCrushingSuccess(cardEconomy, possession.attackingSide);
				// RF-005/RF-009: hand never exceeds 7 cards — discard overflow to sub-deck bottom
				cardEconomy = selectDiscardsToLimit(cardEconomy, possession.attackingSide);
			}

			// Emit possessionStreak if earned
			const streakResult = emitPossessionStreak(
				possession,
				momentum,
				possession.attackingSide,
			);
			for (const e of streakResult.events) allEvents.push(e);
			possession = streakResult.possession;
			momentum = streakResult.momentum;

			// Advance clock (normalDuel = 1 play)
			clock = advanceClock(clock, 'normalDuel');

			// N2: splitBall costs an extra play (the +1 for mini-duelo, clock responsibility)
			if (segment === 'splitBall') {
				clock = advanceClock(clock, 'splitBall');
			}

			// Track halftime transition
			if (clock.phase === 'secondHalf' && clock.playsElapsed === 0) {
				allEvents.push({ type: 'clockPhaseChanged', phase: 'secondHalf' });
			} else if (clock.phase === 'stoppage' && clock.playsElapsed === 0) {
				allEvents.push({ type: 'clockPhaseChanged', phase: 'stoppage' });
			}

			// Handle possession transitions (loss/turnover)
			const isLoss =
				transition.kind === 'possessionLost' ||
				transition.kind === 'disadvantageLoss' ||
				transition.kind === 'devastatingCounter';

			if (isLoss) {
				const stealingSide: MomentumSide =
					possession.attackingSide === 'home' ? 'away' : 'home';
				const pressingResult = emitPressingSteal(possession.strip, stealingSide, momentum);
				for (const e of pressingResult.events) allEvents.push(e);
				momentum = pressingResult.momentum;
				possessionReason = 'turnover';
				possessionEnded = true;
			}
		}

		// Close possession
		const preCloseState: MatchState = {
			...state,
			clock,
			possession,
			momentum,
			score,
			rng,
			lastGaspUsed,
			...(cardEconomy !== undefined ? { cardEconomy } : {}),
		};
		const closeResult = closePossession(preCloseState, possessionReason);
		for (const e of closeResult.events) allEvents.push(e);
		state = closeResult.state;

		// Open new possession if match continues
		if (!isClockExpired(state.clock)) {
			const currentSide = state.possession.attackingSide;
			const nextSide: MomentumSide = currentSide === 'home' ? 'away' : 'home';

			// RF-020: the side that just lost the ball (now the defender) may retreat
			// before the rival's possession starts.
			if (state.cardEconomy) {
				state = {
					...state,
					cardEconomy: selectRetreat(state.cardEconomy, currentSide),
				};
			}

			const newPossession = createPossession(nextSide);
			state = { ...state, possession: newPossession };

			// Draw cards for both teams on possession change
			if (state.cardEconomy) {
				let newCardEconomy = drawOnPossessionChange(state.cardEconomy, nextSide);
				// RF-005/RF-009: hand never exceeds 7 cards — discard overflow to sub-deck bottom
				newCardEconomy = selectDiscardsToLimit(newCardEconomy, 'home');
				newCardEconomy = selectDiscardsToLimit(newCardEconomy, 'away');
				// Regenerate goalkeeper set for the new defender
				const newDefSide: MomentumSide = nextSide === 'home' ? 'away' : 'home';
				const defAttrVal = state.teamProfiles?.[newDefSide]?.attribute ?? 10;
				const newGoalSet = regenerateGoalkeeperSet({
					reflexes: defAttrVal,
					handling: defAttrVal,
					aerialReach: defAttrVal,
					oneOnOnes: defAttrVal,
				});
				state = {
					...state,
					cardEconomy: {
						...newCardEconomy,
						goalkeeperSets: {
							...newCardEconomy.goalkeeperSets,
							[newDefSide]: newGoalSet,
						},
						mulliganUsedThisPossession: {
							...newCardEconomy.mulliganUsedThisPossession,
							home: false,
							away: false,
						},
						retreatUsedThisPossession: {
							...newCardEconomy.retreatUsedThisPossession,
							home: false,
							away: false,
						},
					},
				};
			}

			allEvents.push({ type: 'possessionStarted', side: nextSide, reason: 'turnover' });
		}
	}

	return { state, events: allEvents };
}
