import type { DuelEvent, DuelSegment } from './types';

// Momentum de duelos de eslabón NO se emite como evento: la §7 (tabla de
// duelos) lo deriva directamente del DuelSegment (tramo más específico,
// incluido el aplastante a +1). Ver spec 003 y ADR correspondiente.
const EVENTS_BY_SEGMENT: Record<DuelSegment, DuelEvent[]> = {
	crushingSuccess: [
		{ type: 'advance', side: 'attack' },
		{ type: 'cardSteal', side: 'attack' },
	],
	cleanSuccess: [{ type: 'advance', side: 'attack' }],
	forcedAdvance: [
		{ type: 'advance', side: 'attack' },
		{ type: 'pressure', delta: 1 },
	],
	splitBall: [{ type: 'miniDuel' }],
	simpleLoss: [{ type: 'transition' }],
	disadvantagedLoss: [{ type: 'transition' }],
	devastatingCounter: [{ type: 'transition' }, { type: 'cardSteal', side: 'defense' }],
};

export function emitEvents(segment: DuelSegment): DuelEvent[] {
	return [...EVENTS_BY_SEGMENT[segment]];
}
