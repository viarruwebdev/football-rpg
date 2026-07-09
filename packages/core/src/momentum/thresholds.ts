import type {
	MatchMomentumState,
	MomentumSide,
	MomentumState,
	MomentumThreshold,
	ThresholdEffect,
	ThresholdReset,
} from './types';

const POSITIVE_MECHANICAL_THRESHOLDS: readonly [MomentumThreshold, MomentumThreshold] = [3, 4];
const NEGATIVE_MECHANICAL_THRESHOLDS: readonly [MomentumThreshold, MomentumThreshold] = [-3, -4];

function opposite(side: MomentumSide): MomentumSide {
	return side === 'home' ? 'away' : 'home';
}

function mechanicalEffect(threshold: MomentumThreshold, side: MomentumSide): ThresholdEffect {
	if (threshold === 3) return { type: 'cardPowerBonus', side, amount: 1, threshold };
	if (threshold === -3) return { type: 'cardPowerBonus', side, amount: -1, threshold };
	if (threshold === 4) return { type: 'extraCardDraw', side, amount: 1, threshold };
	return { type: 'extraCardDraw', side, amount: -1, threshold: -4 };
}

export function detectThresholdCrossing(
	before: MatchMomentumState,
	after: MatchMomentumState,
	movedSide: MomentumSide,
): { effects: ThresholdEffect[]; resets: ThresholdReset[] } {
	const effects: ThresholdEffect[] = [];
	const resets: ThresholdReset[] = [];

	const beforeState = before[movedSide];
	const barBefore = beforeState.bar;
	const barAfter = after[movedSide].bar;

	for (const threshold of POSITIVE_MECHANICAL_THRESHOLDS) {
		if (
			barBefore < threshold &&
			barAfter >= threshold &&
			!beforeState.crossedThresholds.has(threshold)
		) {
			effects.push(mechanicalEffect(threshold, movedSide));
		}
	}
	for (const threshold of NEGATIVE_MECHANICAL_THRESHOLDS) {
		if (
			barBefore > threshold &&
			barAfter <= threshold &&
			!beforeState.crossedThresholds.has(threshold)
		) {
			effects.push(mechanicalEffect(threshold, movedSide));
		}
	}

	// +5 own peak: enteredTheZone (single slot) + perfectPlayUnlocked (re-fires like ±3/±4)
	if (barBefore < 5 && barAfter >= 5) {
		if (!beforeState.crossedThresholds.has(5)) {
			effects.push({ type: 'perfectPlayUnlocked', side: movedSide });
		}
		if (beforeState.playerInTheZone === null) {
			effects.push({
				type: 'enteredTheZone',
				side: movedSide,
				playerId: `${movedSide}-zone-player`,
				triggeredBy: 'ownPeak',
			});
		}
	}

	// -5 rival trough: enteredTheZone for the benefited (opposite) side, no perfectPlayUnlocked
	if (barBefore > -5 && barAfter <= -5) {
		const benefitedSide = opposite(movedSide);
		const benefitedState = before[benefitedSide];
		if (benefitedState.playerInTheZone === null) {
			effects.push({
				type: 'enteredTheZone',
				side: benefitedSide,
				playerId: `${benefitedSide}-zone-player`,
				triggeredBy: 'rivalTrough',
			});
		}
	}

	// Resets: thresholds that were active in `before` but the bar has now
	// dropped below the next threshold down, re-enabling a future re-fire.
	for (const threshold of beforeState.crossedThresholds) {
		if (threshold > 0 && barAfter < threshold) {
			resets.push({ side: movedSide, threshold });
		} else if (threshold < 0 && barAfter > threshold) {
			resets.push({ side: movedSide, threshold });
		}
	}

	return { effects, resets };
}

export function applyThresholdEffects(
	state: MomentumState,
	effects: ThresholdEffect[],
	resets: ThresholdReset[],
	side: MomentumSide,
): MomentumState {
	const crossedThresholds = new Set(state.crossedThresholds);
	let playerInTheZone = state.playerInTheZone;

	for (const reset of resets) {
		if (reset.side === side) {
			crossedThresholds.delete(reset.threshold);
		}
	}

	for (const effect of effects) {
		if (effect.side !== side) continue;

		if (effect.type === 'cardPowerBonus') {
			crossedThresholds.add(effect.threshold);
		} else if (effect.type === 'extraCardDraw') {
			crossedThresholds.add(effect.threshold);
		} else if (effect.type === 'perfectPlayUnlocked') {
			crossedThresholds.add(5);
		} else if (effect.type === 'enteredTheZone') {
			if (playerInTheZone === null) {
				playerInTheZone = { playerId: effect.playerId, triggeredBy: effect.triggeredBy };
			}
		}
	}

	return { ...state, crossedThresholds, playerInTheZone };
}
