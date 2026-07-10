import type { DuelSegment } from '../duel';
import type { PossessionTransition } from './types';
import { DUEL_SEGMENT_TO_TRANSITION } from './types';

export function segmentToTransition(segment: DuelSegment): PossessionTransition {
	return DUEL_SEGMENT_TO_TRANSITION[segment];
}
