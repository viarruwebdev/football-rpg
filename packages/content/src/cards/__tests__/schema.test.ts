import { describe, expect, it } from 'vitest';
import { CardSchema } from '../schema';
import { testCards, zeroPowerCard } from '../testFixtures';

describe('CardSchema', () => {
	it('valid fixture passes parse', () => {
		expect(() => CardSchema.parse(testCards[0])).not.toThrow();
	});

	it('potencia -1 lanza', () => {
		expect(() => CardSchema.parse({ ...testCards[0], potencia: -1 })).toThrow();
	});

	it('potencia 11 lanza', () => {
		expect(() => CardSchema.parse({ ...testCards[0], potencia: 11 })).toThrow();
	});

	it('fase no reconocida lanza', () => {
		expect(() => CardSchema.parse({ ...testCards[0], fase: 'X' })).toThrow();
	});

	it('potencia 0 es válida (utilidad pura)', () => {
		expect(() => zeroPowerCard()).not.toThrow();
		expect(zeroPowerCard().potencia).toBe(0);
	});
});
