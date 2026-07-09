import { saturate, updateDerived } from './state';
import type { DegradationContext, MomentumState } from './types';

const DEGRADATION_STEP = 1;
const DETERMINATION_THRESHOLD = 16;
const DETERMINATION_STEP = 2;

export function degradeMomentum(state: MomentumState, context: DegradationContext): MomentumState {
	const { bar } = state;
	const accelerated = context.determinationAverage >= DETERMINATION_THRESHOLD;

	let newBar = bar;

	if (bar > 0 && !context.hadSignificantEventOrWin) {
		const step = accelerated ? DETERMINATION_STEP : DEGRADATION_STEP;
		newBar = Math.max(0, bar - step);
	} else if (bar < 0) {
		const step = accelerated ? DETERMINATION_STEP : DEGRADATION_STEP;
		newBar = Math.min(0, bar + step);
	}

	const traitOverride = context.traitHook?.overrideDelta?.({
		kind: 'degradation',
		defaultDelta: newBar - bar,
		state,
	});
	if (traitOverride !== undefined) {
		newBar = bar + traitOverride;
		if (bar > 0 && newBar < 0) newBar = 0;
		if (bar < 0 && newBar > 0) newBar = 0;
	}

	const saturated = saturate(newBar);

	return {
		...state,
		bar: saturated,
		...updateDerived(state, saturated),
	};
}
