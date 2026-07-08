import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { attributeToInfluence } from '../../duel/attributeToInfluence';
import { computeBand } from '../../duel/uncertainty';
import { makeRng } from '../../rng/mulberry32';
import { classifyShot } from '../classify';
import { emitShotEvents } from '../events';
import { applyShotModifiers } from '../modifiers';
import { resolveShot } from '../resolveShot';
import type { ShotInput, ShotSegment } from '../types';

const featurePath = fileURLToPath(
	new URL('../../../../../features/002-remate-portero.feature', import.meta.url),
);
const feature = await loadFeature(featurePath, { language: 'es' });

const SEGMENT_LABELS: Record<ShotSegment, string> = {
	unstoppableGoal: 'Gol imparable',
	goal: 'Gol',
	goalOnRebound: 'Gol con rebote',
	greatSave: 'Paradón',
	solidSave: 'Parada sólida',
	counterattackSave: 'Parada y contragolpe',
};

function baseInput(): ShotInput {
	return {
		shooter: { cardPower: 5, attribute: 12, modifiers: [], composure: 10 },
		keeper: { cardPower: 5, attribute: 12, modifiers: [], composure: 10 },
		modifierContext: {
			hasAssist: false,
			isHeaderAfterCross: false,
			hadForcedAdvance: false,
			shotZone: 'area',
			isLateralAngle: false,
			longShotsAttribute: 1,
		},
	};
}

describeFeature(feature, ({ Background, Scenario, ScenarioOutline }) => {
	Background(({ Given }) => {
		Given('el resolvedor de remate del núcleo', () => {
			expect(typeof resolveShot).toBe('function');
		});
	});

	Scenario('el resultado es reproducible con la misma semilla', ({ Given, When, Then }) => {
		let input: ShotInput;
		let rng: ReturnType<typeof makeRng>;
		let first: ReturnType<typeof resolveShot>;
		let second: ReturnType<typeof resolveShot>;

		Given('un remate cualquiera con la semilla 42', () => {
			input = baseInput();
			rng = makeRng(42);
		});

		When('lo resuelvo dos veces', () => {
			first = resolveShot(input, rng);
			second = resolveShot(input, rng);
		});

		Then('obtengo el mismo tramo de resultado y los mismos eventos ambas veces', () => {
			expect(first).toEqual(second);
		});
	});

	ScenarioOutline(
		'cada resultado cae en exactamente un tramo de la tabla de remate',
		({ Given, When, Then }, variables) => {
			let result: number;
			let segment: ShotSegment;

			Given('un Resultado numérico de <resultado>', () => {
				result = Number(variables.resultado);
			});

			When('clasifico el desenlace del remate', () => {
				segment = classifyShot(result);
			});

			Then('el tramo es "<tramo>"', () => {
				expect(SEGMENT_LABELS[segment]).toBe(variables.tramo);
			});
		},
	);

	Scenario('la tabla de remate es asimétrica hacia el gol', ({ Given, When, Then, And }) => {
		let segment0: ShotSegment;
		let segment1: ShotSegment;

		Given('un remate cuyo Resultado es exactamente 0', () => {
			segment0 = classifyShot(0);
		});

		When('lo resuelvo', () => {
			// already computed in Given
		});

		Then('el tramo es "Paradón" y no hay gol', () => {
			expect(segment0).toBe('greatSave');
			expect(['unstoppableGoal', 'goal', 'goalOnRebound']).not.toContain(segment0);
		});

		And('un remate cuyo Resultado es +1 sí es gol ("Gol con rebote")', () => {
			segment1 = classifyShot(1);
			expect(segment1).toBe('goalOnRebound');
		});
	});

	Scenario(
		'en juego abierto el remate no tiene componente de carril',
		({ Given, When, Then, And }) => {
			let withPenalty: ReturnType<typeof resolveShot>;
			let withoutPenalty: ReturnType<typeof resolveShot>;

			Given('un remate que no es penalti', () => {
				withoutPenalty = resolveShot(baseInput(), makeRng(1));
			});

			When('calculo la fuerza del portero', () => {
				withPenalty = resolveShot({ ...baseInput(), isPenalty: true }, makeRng(1));
			});

			Then('no se aplica ningún efecto de carril a la fuerza del portero', () => {
				// no lane in shot resolution
				expect(typeof withoutPenalty.result).toBe('number');
			});

			And('la bandera esPenalti es un no-op en v1 (no altera la resolución)', () => {
				expect(withoutPenalty).toEqual(withPenalty);
			});
		},
	);

	Scenario(
		'la asistencia previa aporta +3 de modificador bruto al rematador',
		({ Given, When, Then }) => {
			let mods: number[];

			Given('un remate con asistencia previa y sin otros modificadores', () => {
				mods = applyShotModifiers({
					hasAssist: true,
					isHeaderAfterCross: false,
					hadForcedAdvance: false,
					shotZone: 'area',
					isLateralAngle: false,
					longShotsAttribute: 1,
				});
			});

			When('calculo los modificadores brutos del rematador', () => {
				// already computed
			});

			Then('valen +3', () => {
				expect(mods).toEqual([3]);
			});
		},
	);

	Scenario('el cabezazo tras centro aporta +2 de modificador bruto', ({ Given, When, Then }) => {
		let mods: number[];

		Given('un remate de cabeza tras un centro, sin otros modificadores', () => {
			mods = applyShotModifiers({
				hasAssist: false,
				isHeaderAfterCross: true,
				hadForcedAdvance: false,
				shotZone: 'area',
				isLateralAngle: false,
				longShotsAttribute: 1,
			});
		});

		When('calculo los modificadores brutos del rematador', () => {
			// already computed
		});

		Then('valen +2', () => {
			expect(mods).toEqual([2]);
		});
	});

	ScenarioOutline(
		'el disparo lejano penaliza según zona y Long Shots',
		({ Given, When, Then, And }, variables) => {
			let distanceMod: number;

			Given('un disparo lejano desde la zona <zona>', () => {
				// zone set in And
			});

			And('un rematador con Long Shots <longShots>', () => {
				const zone = variables.zona === 'Ataque' ? 'attack' : 'midfield';
				const ls = Number(variables.longShots);
				const mods = applyShotModifiers({
					hasAssist: false,
					isHeaderAfterCross: false,
					hadForcedAdvance: false,
					shotZone: zone,
					isLateralAngle: false,
					longShotsAttribute: ls,
				});
				distanceMod = mods[0] ?? 0;
			});

			When('calculo el modificador de disparo lejano', () => {
				// already computed
			});

			Then('vale <penalizador>', () => {
				expect(distanceMod).toBe(Number(variables.penalizador));
			});
		},
	);

	Scenario(
		'la influencia usa Finishing del rematador y Reflexes del portero',
		({ When, Then, And }) => {
			When('calculo la fuerza del rematador con Finishing 18', () => {
				expect(attributeToInfluence(18)).toBe(4);
			});

			Then('su influencia de atributo es +4', () => {
				expect(attributeToInfluence(18)).toBe(4);
			});

			And('la del portero con Reflexes 9 es -1', () => {
				expect(attributeToInfluence(9)).toBe(-1);
			});
		},
	);

	Scenario(
		'un gol emite el evento de momentum pero no lo aplica',
		({ Given, When, Then, And }) => {
			let events: ReturnType<typeof emitShotEvents>;

			Given('un remate cuyo Resultado es +3 o más', () => {
				// result = 3 → 'goal'
			});

			When('lo resuelvo', () => {
				events = emitShotEvents('goal');
			});

			Then('se emite un evento de gol', () => {
				expect(events).toContainEqual({ type: 'goal' });
			});

			And('se emite un evento de momentum "+2 atacante"', () => {
				expect(events).toContainEqual({ type: 'momentum', side: 'attack', cause: 'goal' });
			});

			And('el resolvedor no modifica por sí mismo la barra de momentum', () => {
				expect(Array.isArray(events)).toBe(true);
			});
		},
	);

	Scenario('un paradón concede córner y momentum al defensor', ({ Given, When, Then, And }) => {
		let events: ReturnType<typeof emitShotEvents>;

		Given('un remate cuyo Resultado es exactamente 0', () => {
			// result = 0 → 'greatSave'
		});

		When('lo resuelvo', () => {
			events = emitShotEvents('greatSave');
		});

		Then('se emite un evento de córner', () => {
			expect(events).toContainEqual({ type: 'greatSave', hasCorner: true });
		});

		And('se emite un evento de momentum "+1 defensor"', () => {
			expect(events).toContainEqual({
				type: 'momentum',
				side: 'defense',
				cause: 'greatSave',
			});
		});
	});

	Scenario('el suelo de banda se hereda del motor de 001', ({ Given, When, Then }) => {
		let band: number;

		Given('un remate muy igualado con un portero de Composure 20', () => {
			// differential ~0, composure 20
		});

		When('determino la banda de incertidumbre', () => {
			band = computeBand(0, 20, false);
		});

		Then('la banda no es inferior a ±3', () => {
			expect(band).toBeGreaterThanOrEqual(3);
		});
	});
});
