import type { MatchClock, MatchPhase, TimeConsumingAction, TimeConsumingEvent } from './types';

export const CLOCK_CONSUMPTION: Record<TimeConsumingAction, number> = {
	normalDuel: 1,
	splitBall: 2,
	foulPlusFreeKick: 1,
	// A1: corner, penalty, sterilePossession are valid entries with no emitter in v1
	// (extension points for future features — §2 table is total, keep them)
	corner: 2,
	penalty: 2,
	substitution: 1,
	laneChange: 1,
	safePass: 1,
	sterilePossession: 2,
	shot: 1,
};

const PHASE_ORDER: MatchPhase[] = ['firstHalf', 'secondHalf', 'stoppage'];

function nextPhase(phase: MatchPhase): MatchPhase {
	const idx = PHASE_ORDER.indexOf(phase);
	if (idx < PHASE_ORDER.length - 1) {
		return PHASE_ORDER[idx + 1] as MatchPhase;
	}
	return 'stoppage';
}

function computeVisibility(clock: MatchClock): MatchClock['stoppageTimeVisibility'] {
	if (clock.phase !== 'stoppage') {
		return clock.stoppageTimeVisibility;
	}
	const remaining = clock.exactStoppageTime - clock.playsElapsed;
	if (remaining <= 2) {
		return { kind: 'exact', value: clock.exactStoppageTime };
	}
	return {
		kind: 'range',
		min: Math.floor(clock.exactStoppageTime),
		max: Math.ceil(clock.exactStoppageTime + 2),
	};
}

export function advanceClock(clock: MatchClock, action: TimeConsumingAction): MatchClock {
	const cost = CLOCK_CONSUMPTION[action];
	let playsElapsed = clock.playsElapsed + cost;
	let phase = clock.phase;

	if (phase === 'firstHalf' && playsElapsed >= clock.halfLength) {
		phase = nextPhase(phase);
		playsElapsed = playsElapsed - clock.halfLength;
		if (phase === 'secondHalf' && playsElapsed >= clock.halfLength) {
			phase = nextPhase(phase);
			playsElapsed = playsElapsed - clock.halfLength;
		}
	} else if (phase === 'secondHalf' && playsElapsed >= clock.halfLength) {
		phase = nextPhase(phase);
		playsElapsed = playsElapsed - clock.halfLength;
	}

	const updated: MatchClock = { ...clock, phase, playsElapsed };
	return { ...updated, stoppageTimeVisibility: computeVisibility(updated) };
}

export function computeStoppageTime(base: number, contributions: TimeConsumingEvent[]): number {
	let extra = 0;
	for (const e of contributions) {
		if (e.kind === 'foul') extra += 0.5;
		else if (e.kind === 'injury') extra += 1;
		else if (e.kind === 'substitution') extra += 0.5;
	}
	return base + extra;
}
