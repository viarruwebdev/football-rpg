import type { MatchEvent, MatchState } from './types';

export function handleClockExpiry(state: MatchState): { state: MatchState; events: MatchEvent[] } {
	const events: MatchEvent[] = [];
	const attackingSide = state.possession.attackingSide;
	const defendingSide = attackingSide === 'home' ? 'away' : 'home';

	// RF-013: last gasp — only if attacker is LOSING and lastGasp not yet used
	const attackerScore = state.score[attackingSide];
	const defenderScore = state.score[defendingSide];
	const attackerIsLosing = attackerScore < defenderScore;

	if (attackerIsLosing && !state.lastGaspUsed) {
		events.push({ type: 'lastGasp', side: attackingSide });
		return {
			state: { ...state, lastGaspUsed: true },
			events,
		};
	}

	return { state, events };
}
