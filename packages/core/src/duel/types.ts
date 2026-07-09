export type Lane = 'left' | 'center' | 'right';

/** Opaque special-technique id. The catalog arrives in a later feature. */
export type SpecialTechniqueId = string;

export interface DuelSide {
	/** Base power of the card played (integer, catalog-defined range). */
	cardPower: number;
	/** Player's key attribute, 1-20 scale. */
	attribute: number;
	/** Situational modifiers (momentum, Technique, First Touch, Important
	 *  Matches, style, role, chemistry, conditions, accumulated pressure…).
	 *  Feed into the diminishing-returns calculation. */
	modifiers: number[];
	/** Attacker side only: lane chosen as the attack's target. */
	chosenLane?: Lane;
	/** Defender side only: lane bet on to anticipate the attack. */
	bettedLane?: Lane;
	/** Player's Composure value (1-20). Adjusts the uncertainty band. */
	composure: number;
	/** v1 extension point: opaque special-technique id, if the card has one. */
	specialTechnique?: SpecialTechniqueId;
}

export interface DuelInput {
	attack: DuelSide;
	defense: DuelSide;
	/** Extension point for pre-reveal instants (catalog in a later feature). */
	preRevealInstants?: unknown[];
	/** Extension point for post-reveal lane effects (catalog in a later feature). */
	postRevealEffects?: unknown[];
}

export type DuelSegment =
	| 'crushingSuccess' // Result >= +6
	| 'cleanSuccess' // Result +3..+5
	| 'forcedAdvance' // Result +1..+2
	| 'splitBall' // Result = 0
	| 'simpleLoss' // Result -1..-2
	| 'disadvantagedLoss' // Result -3..-5
	| 'devastatingCounter'; // Result <= -6

export type DuelEvent =
	| { type: 'advance'; side: 'attack' | 'defense' }
	| { type: 'cardSteal'; side: 'attack' | 'defense' }
	| { type: 'pressure'; delta: number }
	| { type: 'transition' }
	| { type: 'miniDuel' };

export interface DuelResult {
	/** Integer value: differential + uncertainty. */
	result: number;
	/** Segment the result falls into. */
	segment: DuelSegment;
	/** Events to dispatch to upper layers, in order. */
	events: DuelEvent[];
}
