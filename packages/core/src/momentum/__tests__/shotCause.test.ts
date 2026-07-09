import { describe, expect, it } from 'vitest';
import type { ShotSegment } from '../../shot/types';
import { shotSegmentToMomentumCause } from '../shotCause';
import type { MomentumEventCause } from '../types';

describe('shotSegmentToMomentumCause — §7 tabla de eventos significativos', () => {
	const cases: Array<[ShotSegment, MomentumEventCause | null]> = [
		// All goal variants → 'goal' (+2 attacker, same delta regardless of how it went in)
		['unstoppableGoal', 'goal'],
		['goal', 'goal'],
		['goalOnRebound', 'goal'], // rebound distinction is for game events, not momentum
		// Goalkeeper special save → epicSave (+1 defender)
		['greatSave', 'epicSave'],
		// No momentum event for these tramos (not in §7 "eventos significativos" table)
		['solidSave', null],
		['counterattackSave', null],
	];

	it.each(cases)('%s → %s', (segment, expected) => {
		expect(shotSegmentToMomentumCause(segment)).toBe(expected);
	});
});
