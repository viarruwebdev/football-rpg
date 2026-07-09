export type MomentumSide = 'home' | 'away';

export type MomentumThreshold = 3 | 4 | 5 | -3 | -4 | -5;

export interface PlayerInTheZone {
	playerId: string;
	triggeredBy: 'ownPeak' | 'rivalTrough';
}

export interface MomentumState {
	/** Fractional bar, 0.5 steps, saturated in [-5, +5]. */
	bar: number;
	/** Consecutive duels won by this team. Resets to 0 on any loss segment. */
	consecutiveWins: number;
	/** Highest value `bar` has reached this match. Never decreases. */
	maxReached: number;
	/** Consecutive plays `bar` has stayed at exactly +5. Resets to 0 as soon as
	 *  `bar` leaves +5. */
	playsAtPeakPositive: number;
	/** Thresholds (+3/+4/+5/-3/-4 and the "Jugada perfecta" component of -5)
	 *  that already fired their one-shot effect since the last time the bar
	 *  dropped below the next threshold down. "En la zona" does NOT use this
	 *  set — see `playerInTheZone`, which never re-fires. */
	crossedThresholds: Set<MomentumThreshold>;
	/** Player "en la zona" benefiting THIS team, if already granted this
	 *  match. Single slot per team regardless of which path (`ownPeak` or
	 *  `rivalTrough`) fills it first. */
	playerInTheZone: PlayerInTheZone | null;
}

export interface MatchMomentumState {
	home: MomentumState;
	away: MomentumState;
}

/** Semantic event cause. Reuses `ShotMomentumCause` names where they already
 *  exist in the codebase (`goal`, `greatSave`) — no translation table. Covers
 *  the 9 rows of the manual's "eventos significativos" table with 8
 *  identifiers (`goal` covers scoring/conceding via `side`). */
export type MomentumEventCause =
	| 'goal'
	| 'tideTurningGoal'
	| 'specialTechniqueSuccess'
	| 'epicSave'
	| 'oneOnOneSave'
	| 'pressingSteal'
	| 'possessionStreak'
	| 'greatSave';

export type ThresholdEffect =
	| { type: 'cardPowerBonus'; side: MomentumSide; amount: 1 | -1; threshold: 3 | -3 }
	| { type: 'extraCardDraw'; side: MomentumSide; amount: 1 | -1; threshold: 4 | -4 }
	| {
			type: 'enteredTheZone';
			side: MomentumSide;
			playerId: string;
			triggeredBy: 'ownPeak' | 'rivalTrough';
	  }
	| { type: 'perfectPlayUnlocked'; side: MomentumSide };

export interface ThresholdReset {
	side: MomentumSide;
	threshold: MomentumThreshold;
}

export interface TraitHookContext {
	kind: 'duelLoss' | 'degradation';
	defaultDelta: number;
	state: Readonly<MomentumState>;
}

export interface TraitHook {
	overrideDelta?(context: TraitHookContext): number | undefined;
}

export interface DegradationContext {
	hadSignificantEventOrWin: boolean;
	determinationAverage: number;
	traitHook?: TraitHook;
}
