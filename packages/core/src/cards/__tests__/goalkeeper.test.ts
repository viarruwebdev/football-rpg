import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { regenerateGoalkeeperSet, useGoalkeeperCard } from '../goalkeeper';

describe('regenerateGoalkeeperSet', () => {
	it('Reflexes 16, otros 10 → Parada básica + Estirada (2 cartas)', () => {
		const set = regenerateGoalkeeperSet({
			reflexes: 16,
			handling: 10,
			aerialReach: 10,
			oneOnOnes: 10,
		});
		const ids = set.available.map((c) => c.id);
		expect(ids).toContain('parada-basica');
		expect(ids).toContain('estirada');
		expect(ids).not.toContain('blocaje');
		expect(ids).not.toContain('despeje-punos');
		expect(ids).not.toContain('achique');
		expect(set.available.length).toBe(2);
	});

	it('todos atributos 10 → solo Parada básica', () => {
		const set = regenerateGoalkeeperSet({
			reflexes: 10,
			handling: 10,
			aerialReach: 10,
			oneOnOnes: 10,
		});
		expect(set.available.map((c) => c.id)).toEqual(['parada-basica']);
	});

	it('todos umbrales superados → las 5 cartas', () => {
		const set = regenerateGoalkeeperSet({
			reflexes: 16,
			handling: 14,
			aerialReach: 16,
			oneOnOnes: 18,
		});
		expect(set.available.length).toBe(5);
	});

	it('usedThisPossession vacío al regenerar', () => {
		const set = regenerateGoalkeeperSet({
			reflexes: 16,
			handling: 14,
			aerialReach: 16,
			oneOnOnes: 18,
		});
		expect(set.usedThisPossession.size).toBe(0);
	});

	it('no usa Rng — resultado determinista por atributos puros', () => {
		const a = regenerateGoalkeeperSet({
			reflexes: 16,
			handling: 14,
			aerialReach: 16,
			oneOnOnes: 18,
		});
		const b = regenerateGoalkeeperSet({
			reflexes: 16,
			handling: 14,
			aerialReach: 16,
			oneOnOnes: 18,
		});
		expect(a.available.map((c) => c.id)).toEqual(b.available.map((c) => c.id));
	});
});

describe('useGoalkeeperCard', () => {
	it('estirada disponible → devuelve carta y set actualizado', () => {
		const set = regenerateGoalkeeperSet({
			reflexes: 16,
			handling: 10,
			aerialReach: 10,
			oneOnOnes: 10,
		});
		const result = useGoalkeeperCard(set, 'estirada');
		expect(result).not.toBeNull();
		expect(result?.card.id).toBe('estirada');
		expect(result?.set.usedThisPossession.has('estirada')).toBe(true);
	});

	it('estirada segunda vez en la misma posesión → null (CE-008)', () => {
		const set = regenerateGoalkeeperSet({
			reflexes: 16,
			handling: 10,
			aerialReach: 10,
			oneOnOnes: 10,
		});
		const first = useGoalkeeperCard(set, 'estirada')!;
		const second = useGoalkeeperCard(first.set, 'estirada');
		expect(second).toBeNull();
	});

	it('parada-basica: uso ilimitado — nunca devuelve null (RF-014)', () => {
		const set = regenerateGoalkeeperSet({
			reflexes: 10,
			handling: 10,
			aerialReach: 10,
			oneOnOnes: 10,
		});
		const r1 = useGoalkeeperCard(set, 'parada-basica');
		expect(r1).not.toBeNull();
		const r2 = useGoalkeeperCard(r1!.set, 'parada-basica');
		expect(r2).not.toBeNull();
	});
});

describe('F1/Principio 4 — goalkeeper.ts no hardcodea umbrales ni potencias', () => {
	it('grep negativo: no contiene literales de umbral (13, 15, 17) ni potencias (3/4/5/6) como valores literales', () => {
		let output = '';
		try {
			// Exclude the test file itself; check only the implementation
			output = execSync(
				"grep -n '\\b13\\b\\|\\b15\\b\\|\\b17\\b\\|potencia.*[3456]\\|[3456].*potencia' packages/core/src/cards/goalkeeper.ts",
				{ encoding: 'utf8', cwd: '/home/vicente/www/football-rpg' },
			);
		} catch {
			output = '';
		}
		expect(output.trim()).toBe('');
	});
});
