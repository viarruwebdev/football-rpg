import type { DuelSegment } from '../duel';
import type {
	MatchMomentumState,
	MomentumEventCause,
	MomentumSide,
	ThresholdEffect,
} from '../momentum';
import type { Rng } from '../rng';

export type MatchPhase = 'firstHalf' | 'secondHalf' | 'stoppage';

export type Strip = 'defense' | 'midfield' | 'attack' | 'area';

export type Lane = 'left' | 'center' | 'right';

export type TimeConsumingAction =
	| 'normalDuel'
	| 'splitBall'
	| 'foulPlusFreeKick'
	| 'corner'
	| 'penalty'
	| 'substitution'
	| 'laneChange'
	| 'safePass'
	| 'sterilePossession'
	| 'shot';

export interface TimeConsumingEvent {
	kind: 'foul' | 'injury' | 'substitution';
}

export interface MatchClock {
	playsElapsed: number;
	phase: MatchPhase;
	halfLength: 30;
	exactStoppageTime: number;
	stoppageTimeVisibility:
		| { kind: 'range'; min: number; max: number }
		| { kind: 'exact'; value: number };
	stoppageContributions: TimeConsumingEvent[];
}

// NOTE: `transitionBonus` and `zoneBoost` carry the §6 bonus values as data,
// but neither is consumed anywhere — `applyTransition` (possession.ts) returns
// the possession unchanged for both variants. This is deliberate v1 scope
// (RF-019/RF-020, spec.md), the same pattern as `isPenalty?` in feature 002.
// See match/__tests__/transition.test.ts for a test that pins this as
// not-yet-implemented, so cabling it in later is a visible, intentional change.
export type PossessionTransition =
	| { kind: 'crushingAdvance' }
	| { kind: 'cleanAdvance' }
	| { kind: 'forcedAdvance' }
	| { kind: 'splitBall' }
	| { kind: 'possessionLost' }
	| { kind: 'disadvantageLoss'; transitionBonus: 2 }
	| { kind: 'devastatingCounter'; zoneBoost: 3 };

export const DUEL_SEGMENT_TO_TRANSITION: Record<DuelSegment, PossessionTransition> = {
	crushingSuccess: { kind: 'crushingAdvance' },
	cleanSuccess: { kind: 'cleanAdvance' },
	forcedAdvance: { kind: 'forcedAdvance' },
	splitBall: { kind: 'splitBall' },
	simpleLoss: { kind: 'possessionLost' },
	disadvantagedLoss: { kind: 'disadvantageLoss', transitionBonus: 2 },
	devastatingCounter: { kind: 'devastatingCounter', zoneBoost: 3 },
};

export interface PossessionState {
	attackingSide: MomentumSide;
	strip: Strip;
	lane: Lane;
	accumulatedPressure: number;
	duelsWonInPossession: number;
	possessionStreakEmitted: boolean;
	hadSignificantEventOrWin: Record<MomentumSide, boolean>;
}

export type HalftimeAction = unknown;

export type MatchEvent =
	| { type: 'duelResolved'; segment: DuelSegment; transition: PossessionTransition }
	| { type: 'shotResolved'; segment: string }
	| { type: 'possessionStarted'; side: MomentumSide; reason: 'kickoff' | 'turnover' | 'restart' }
	| { type: 'possessionEnded'; side: MomentumSide; reason: 'goal' | 'turnover' | 'clockExpired' }
	| { type: 'goal'; side: MomentumSide }
	| { type: 'clockPhaseChanged'; phase: MatchPhase }
	| { type: 'stoppageTimeRevealed'; value: number }
	| { type: 'momentumThresholdEffect'; effect: ThresholdEffect }
	| { type: 'momentumEventApplied'; cause: MomentumEventCause; side: MomentumSide }
	| { type: 'lastGasp'; side: MomentumSide };

export interface TeamProfile {
	attribute: number;
	cardPower: number;
	composure: number;
}

export interface MatchState {
	clock: MatchClock;
	possession: PossessionState;
	momentum: MatchMomentumState;
	score: Record<MomentumSide, number>;
	rng: Rng;
	/** True if the last-gasp extra duel has already been granted this match. */
	lastGaspUsed?: boolean;
	halftimeActions?: HalftimeAction[];
	/** Team profiles for balance simulation. Defaults to attribute=10, cardPower=5, composure=10. */
	teamProfiles?: Record<MomentumSide, TeamProfile>;
}
