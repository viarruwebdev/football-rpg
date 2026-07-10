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
import type { MatchClock, MatchEvent, MatchState } from './types';

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

	let possessionCount = 0;

	while (!isClockExpired(state.clock) && possessionCount < MAX_POSSESSIONS) {
		possessionCount++;

		let possession = state.possession;
		let momentum = state.momentum;
		let clock = state.clock;
		let score = state.score;
		let rng = state.rng;
		let lastGaspUsed = state.lastGaspUsed ?? false;
		let possessionEnded = false;
		let possessionReason: 'goal' | 'turnover' | 'clockExpired' = 'clockExpired';
		let lastGaspGranted = false;

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
				const shotResult = resolveShot(
					makeStubShotInput(shooterProfile, keeperProfile),
					rngShot,
				);
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
			const duelInput = makeStubDuelInput(mods, attackProfile, defProfile);

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
		};
		const closeResult = closePossession(preCloseState, possessionReason);
		for (const e of closeResult.events) allEvents.push(e);
		state = closeResult.state;

		// Open new possession if match continues
		if (!isClockExpired(state.clock)) {
			const currentSide = state.possession.attackingSide;
			const nextSide: MomentumSide = currentSide === 'home' ? 'away' : 'home';
			const newPossession = createPossession(nextSide);
			state = { ...state, possession: newPossession };
			allEvents.push({ type: 'possessionStarted', side: nextSide, reason: 'turnover' });
		}
	}

	return { state, events: allEvents };
}
