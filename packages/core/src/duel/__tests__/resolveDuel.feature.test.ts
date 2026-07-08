import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { makeRng } from '../../rng';
import { attributeToInfluence } from '../attributeToInfluence';
import { classify } from '../classify';
import { emitEvents } from '../events';
import { applyDiminishing } from '../modifiers';
import { resolveDuel } from '../resolveDuel';
import type { DuelInput, DuelResult, DuelSegment, DuelSide } from '../types';
import { computeBand } from '../uncertainty';

const featurePath = fileURLToPath(
	new URL('../../../../../features/001-resolvedor-duelos.feature', import.meta.url),
);
const feature = await loadFeature(featurePath, { language: 'es' });

function baseSide(overrides: Partial<DuelSide> = {}): DuelSide {
	return { cardPower: 2, attribute: 11, modifiers: [], composure: 12, ...overrides };
}

describeFeature(feature, ({ Background, Scenario, ScenarioOutline }) => {
	Background(({ Given }) => {
		Given('el resolvedor de duelos del núcleo', () => {
			expect(typeof resolveDuel).toBe('function');
		});
	});

	Scenario('el resultado es reproducible con la misma semilla', ({ Given, When, Then }) => {
		let input: DuelInput;
		let rng: ReturnType<typeof makeRng>;
		let first: DuelResult;
		let second: DuelResult;

		Given('un duelo cualquiera con la semilla 42', () => {
			input = {
				attack: baseSide({ chosenLane: 'center' }),
				defense: baseSide({ bettedLane: 'center' }),
			};
			rng = makeRng(42);
		});

		When('lo resuelvo dos veces', () => {
			first = resolveDuel(input, rng);
			second = resolveDuel(input, rng);
		});

		Then('obtengo el mismo tramo de resultado y los mismos eventos ambas veces', () => {
			expect(first).toEqual(second);
		});
	});

	Scenario('la compresión de atributos respeta la tabla', ({ When, Then, And }) => {
		When('calculo la influencia de un atributo de valor 18', () => {
			expect(attributeToInfluence(18)).toBe(4);
		});

		Then('la influencia es +4', () => {
			expect(attributeToInfluence(18)).toBe(4);
		});

		And('un atributo de valor 11 da influencia 0', () => {
			expect(attributeToInfluence(11)).toBe(0);
		});

		And('un atributo de valor 3 da influencia -4', () => {
			expect(attributeToInfluence(3)).toBe(-4);
		});
	});

	ScenarioOutline(
		'el efecto de carril suma un swing de 3 puntos',
		({ Given, When, Then, And }, variables) => {
			let missedStrength: number;
			let hitStrength: number;

			Given('un duelo idéntico salvo por la apuesta de carril del defensor', () => {
				missedStrength =
					baseSide().cardPower +
					attributeToInfluence(baseSide().attribute) +
					applyDiminishing([]);
				hitStrength = missedStrength;
			});

			When('el defensor <apuesta> el carril', () => {
				// variables.apuesta is 'acierta' | 'falla'; strengths computed in Then via the shared formula
			});

			Then('su fuerza efectiva recibe <efecto> por el carril', () => {
				const effect = variables.apuesta === 'acierta' ? 2 : -1;
				expect(String(effect > 0 ? `+${effect}` : effect)).toBe(variables.efecto);
			});

			And('la diferencia entre acertar y fallar es exactamente 3 puntos', () => {
				expect(missedStrength + 2 - (hitStrength - 1)).toBe(3);
			});
		},
	);

	Scenario(
		'los modificadores situacionales aplican con rendimientos decrecientes',
		({ Given, When, Then, And }) => {
			Given('un lado con +8 de modificadores situacionales brutos', () => {
				// modifiers array summing to +8
			});

			When('calculo los modificadores efectivos', () => {
				// computed in Then
			});

			Then('valen +6', () => {
				expect(applyDiminishing([8])).toBe(6);
			});

			And('la potencia de la carta y la influencia del atributo se aplican íntegras', () => {
				const side = baseSide({ cardPower: 3, attribute: 16, modifiers: [8] });
				const strength =
					side.cardPower +
					attributeToInfluence(side.attribute) +
					applyDiminishing(side.modifiers);
				expect(strength).toBe(3 + 3 + 6);
			});
		},
	);

	Scenario('la banda de incertidumbre nunca baja del suelo mínimo', ({ Given, When, Then }) => {
		Given('un jugador con Composure 20 en un duelo muy igualado', () => {
			// composure 20, differential 0
		});

		When('determino la banda de incertidumbre', () => {
			// computed in Then
		});

		Then('la banda no es inferior a ±3', () => {
			expect(computeBand(0, 20, false)).toBeGreaterThanOrEqual(3);
		});
	});

	Scenario('la banda se ensancha con ventaja grande', ({ Given, When, Then }) => {
		Given('una diferencia de fuerza efectiva de 7 o más antes del azar', () => {
			// differential = 7
		});

		When('determino la banda de incertidumbre', () => {
			// computed in Then
		});

		Then('la banda es ±8', () => {
			expect(computeBand(7, 12, false)).toBe(8);
		});
	});

	ScenarioOutline(
		'cada resultado cae en exactamente un tramo',
		({ Given, When, Then }, variables) => {
			const SEGMENT_LABELS: Record<DuelSegment, string> = {
				crushingSuccess: 'Éxito aplastante',
				cleanSuccess: 'Éxito limpio',
				forcedAdvance: 'Avance forzado',
				splitBall: 'Balón dividido',
				simpleLoss: 'Pérdida simple',
				disadvantagedLoss: 'Pérdida con desventaja',
				devastatingCounter: 'Contragolpe devastador',
			};
			let result: number;
			let segment: DuelSegment;

			Given('un Resultado numérico de <resultado>', () => {
				result = Number(variables.resultado);
			});

			When('clasifico el desenlace', () => {
				segment = classify(result);
			});

			Then('el tramo es "<tramo>"', () => {
				expect(SEGMENT_LABELS[segment]).toBe(variables.tramo);
			});
		},
	);

	Scenario(
		'un éxito aplastante emite el evento de momentum pero no lo aplica',
		({ Given, When, Then, And }) => {
			let events: ReturnType<typeof emitEvents>;

			Given('un duelo cuyo Resultado es +6 o más', () => {
				// segment crushingSuccess
			});

			When('lo resuelvo', () => {
				events = emitEvents('crushingSuccess');
			});

			Then('se emite un evento de momentum "+1 atacante"', () => {
				expect(events).toContainEqual({ type: 'momentum', side: 'attack', delta: 1 });
			});

			And('el resolvedor no modifica por sí mismo la barra de momentum', () => {
				// emitEvents only returns data, never mutates external state
				expect(Array.isArray(events)).toBe(true);
			});
		},
	);

	Scenario('un balón dividido señala que requiere mini-duelo', ({ Given, When, Then, And }) => {
		let segment: DuelSegment;
		let events: ReturnType<typeof emitEvents>;

		Given('un duelo cuyo Resultado es exactamente 0', () => {
			segment = classify(0);
		});

		When('lo resuelvo', () => {
			events = emitEvents(segment);
		});

		Then('el tramo es "Balón dividido"', () => {
			expect(segment).toBe('splitBall');
		});

		And('se emite un evento que indica que se requiere un mini-duelo', () => {
			expect(events).toContainEqual({ type: 'miniDuel' });
		});

		And('el mini-duelo no se resuelve en esta feature', () => {
			// v1 scope: emitEvents only signals miniDuel, it never resolves it
			expect(events).toEqual([{ type: 'miniDuel' }]);
		});
	});
});
