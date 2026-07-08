import type { DuelEvent, DuelSegment } from './types';

const EVENTS_BY_SEGMENT: Record<DuelSegment, DuelEvent[]> = {
	crushingSuccess: [
		{ type: 'advance', side: 'attack' },
		{ type: 'cardSteal', side: 'attack' },
		{ type: 'momentum', side: 'attack', delta: 1 },
	],
	cleanSuccess: [{ type: 'advance', side: 'attack' }],
	forcedAdvance: [
		{ type: 'advance', side: 'attack' },
		{ type: 'pressure', delta: 1 },
	],
	splitBall: [{ type: 'miniDuel' }],
	simpleLoss: [{ type: 'transition' }],
	disadvantagedLoss: [{ type: 'transition' }, { type: 'momentum', side: 'defense', delta: 1 }],
	devastatingCounter: [
		{ type: 'transition' },
		{ type: 'cardSteal', side: 'defense' },
		{ type: 'momentum', side: 'defense', delta: 2 },
	],
};

export function emitEvents(segment: DuelSegment): DuelEvent[] {
	return [...EVENTS_BY_SEGMENT[segment]];
}
