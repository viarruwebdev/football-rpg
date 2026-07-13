import { describe, expect, it } from 'vitest';
import { getEffect } from '../effects/registry';

// This test pins the effect registry as empty in v1.
// It MUST break visibly when the first real effect is wired.
// Update this test intentionally when that happens (RF-027, AGENTS.md §10).
describe('Effect registry — vacío en v1', () => {
	it('getEffect devuelve handler identidad para cualquier id', () => {
		const handler = getEffect('cualquier-id');
		expect(typeof handler).toBe('function');
	});

	it('getEffect("amague") devuelve mismo resultado que id desconocido', () => {
		const hAmague = getEffect('amague');
		const hUnknown = getEffect('id-inexistente');
		// Both are identity handlers — no registered effect changes behavior
		const fakeState = {} as never;
		expect(hAmague(fakeState)).toBe(fakeState);
		expect(hUnknown(fakeState)).toBe(fakeState);
	});

	it('el registro está vacío: ningún id produce handler distinto del identidad', () => {
		const h1 = getEffect('vision-periferica');
		const fakeState = {} as never;
		// Identity: returns same reference
		expect(h1(fakeState)).toBe(fakeState);
	});
});
