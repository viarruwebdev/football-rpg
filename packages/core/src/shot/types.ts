export type ShotMomentumCause = 'goal' | 'goalOnRebound' | 'greatSave';

export type ShotSegment =
	| 'unstoppableGoal'
	| 'goal'
	| 'goalOnRebound'
	| 'greatSave'
	| 'solidSave'
	| 'counterattackSave';

export type ShotEvent =
	| { type: 'goal' }
	| { type: 'goalOnRebound' }
	| { type: 'greatSave'; hasCorner: true }
	| { type: 'solidSave'; roleReversal: true }
	| { type: 'counterattackSave' }
	| { type: 'momentum'; side: 'attack' | 'defense'; cause: ShotMomentumCause };

export interface ShotSide {
	cardPower: number;
	attribute: number;
	modifiers: number[];
	composure: number;
}

export interface ShotModifierContext {
	hasAssist: boolean;
	isHeaderAfterCross: boolean;
	hadForcedAdvance: boolean;
	shotZone: 'area' | 'attack' | 'midfield';
	isLateralAngle: boolean;
	longShotsAttribute: number;
}

export interface ShotInput {
	shooter: ShotSide;
	keeper: ShotSide;
	modifierContext: ShotModifierContext;
	isPenalty?: boolean;
}

export interface ShotResult {
	result: number;
	segment: ShotSegment;
	events: ShotEvent[];
}
