import type { MomentumSide } from '../momentum';
import { degradeAndDetect, resetConsecutiveWins } from '../momentum';
import type {
	Lane,
	MatchEvent,
	MatchState,
	PossessionState,
	PossessionTransition,
	Strip,
} from './types';

const STRIP_ORDER: Strip[] = ['defense', 'midfield', 'attack', 'area'];

function advanceStrip(strip: Strip): Strip {
	const idx = STRIP_ORDER.indexOf(strip);
	if (idx < STRIP_ORDER.length - 1) {
		return STRIP_ORDER[idx + 1] as Strip;
	}
	return 'area';
}

export function createPossession(
	attackingSide: MomentumSide,
	strip: Strip = 'defense',
	lane: Lane = 'center',
): PossessionState {
	return {
		attackingSide,
		strip,
		lane,
		accumulatedPressure: 0,
		duelsWonInPossession: 0,
		possessionStreakEmitted: false,
		hadSignificantEventOrWin: { home: false, away: false },
	};
}

export function applyTransition(
	possession: PossessionState,
	transition: PossessionTransition,
): PossessionState {
	switch (transition.kind) {
		case 'crushingAdvance': {
			// Pressure increments only when already advanced (strip != 'defense')
			const pressureDelta = possession.strip !== 'defense' ? 1 : 0;
			return {
				...possession,
				strip: advanceStrip(possession.strip),
				accumulatedPressure: possession.accumulatedPressure + pressureDelta,
				duelsWonInPossession: possession.duelsWonInPossession + 1,
			};
		}
		case 'cleanAdvance':
			return {
				...possession,
				strip: advanceStrip(possession.strip),
				duelsWonInPossession: possession.duelsWonInPossession + 1,
			};
		case 'forcedAdvance': {
			// First eslabón (from 'defense') does not add pressure; subsequent ones do
			const pressureDelta = possession.strip !== 'defense' ? 1 : 0;
			return {
				...possession,
				strip: advanceStrip(possession.strip),
				accumulatedPressure: possession.accumulatedPressure + pressureDelta,
			};
		}
		case 'splitBall':
			return possession;
		case 'possessionLost':
		case 'disadvantageLoss':
		case 'devastatingCounter':
			return possession;
	}
}

export function closePossession(
	state: MatchState,
	reason: 'goal' | 'turnover' | 'clockExpired',
): { state: MatchState; events: MatchEvent[] } {
	const events: MatchEvent[] = [];

	// RF-009c: unconditional reset of consecutiveWins for both sides
	let momentum = {
		home: resetConsecutiveWins(state.momentum.home),
		away: resetConsecutiveWins(state.momentum.away),
	};

	// RF-010: degradeAndDetect for both sides (conditional on no significant event/win)
	const sides: MomentumSide[] = ['home', 'away'];
	for (const side of sides) {
		if (!state.possession.hadSignificantEventOrWin[side]) {
			const result = degradeAndDetect(momentum, side, {
				hadSignificantEventOrWin: false,
				determinationAverage: 10,
			});
			momentum = result.match;
			for (const effect of result.effects) {
				events.push({ type: 'momentumThresholdEffect', effect });
			}
		}
	}

	events.push({
		type: 'possessionEnded',
		side: state.possession.attackingSide,
		reason,
	});

	return {
		state: { ...state, momentum },
		events,
	};
}
