import type { DuelInput, DuelSide, Lane } from '../../packages/core/src/index';
import { makeRng, resolveDuel } from '../../packages/core/src/index';

const SAMPLE_SIZE = 10_000;
const LANES: Lane[] = ['left', 'center', 'right'];

interface CalibrationBand {
	label: string;
	attackAttribute: number;
	defenseAttribute: number;
	min: number;
	max: number;
}

const CALIBRATION_BANDS: CalibrationBand[] = [
	{
		label: 'elite (18) vs mediocre (9)',
		attackAttribute: 18,
		defenseAttribute: 9,
		min: 0.8,
		max: 0.85,
	},
	{
		// attribute 3 -> influence -4 ("poor"), matching the sim-harness table;
		// attribute 4 gives influence -3, a different (less extreme) matchup.
		label: 'elite (18) vs poor (3)',
		attackAttribute: 18,
		defenseAttribute: 3,
		min: 0.9,
		max: 0.95,
	},
	{
		label: 'good (14) vs good (14)',
		attackAttribute: 14,
		defenseAttribute: 14,
		min: 0.45,
		max: 0.55,
	},
];

interface WeightBand {
	label: string;
	target: number;
	tolerance: number;
}

const WEIGHT_BANDS: Record<'rng' | 'lane' | 'attribute', WeightBand> = {
	rng: { label: 'azar', target: 0.33, tolerance: 0.1 },
	lane: { label: 'decision (carril)', target: 0.31, tolerance: 0.1 },
	attribute: { label: 'preparacion (atributos+mods)', target: 0.37, tolerance: 0.1 },
};

function makeSide(attribute: number): DuelSide {
	return { cardPower: 2, attribute, modifiers: [], composure: 12 };
}

function randomLane(rng: ReturnType<typeof makeRng>): Lane {
	return LANES[Math.floor(rng.next() * LANES.length)] ?? 'center';
}

function successRate(attackAttribute: number, defenseAttribute: number): number {
	let successes = 0;
	for (let i = 0; i < SAMPLE_SIZE; i++) {
		const rng = makeRng(i);
		const laneRng = rng.split();
		const chosenLane = randomLane(laneRng);
		const bettedLane = randomLane(laneRng.split());
		const input: DuelInput = {
			attack: { ...makeSide(attackAttribute), chosenLane },
			defense: { ...makeSide(defenseAttribute), bettedLane },
		};
		const { result } = resolveDuel(input, rng);
		if (result > 0) successes++;
	}
	return successes / SAMPLE_SIZE;
}

function resolveWith(
	attackAttribute: number,
	defenseAttribute: number,
	chosenLane: Lane,
	bettedLane: Lane,
	rng: ReturnType<typeof makeRng>,
): number {
	const input: DuelInput = {
		attack: { ...makeSide(attackAttribute), chosenLane },
		defense: { ...makeSide(defenseAttribute), bettedLane },
	};
	return resolveDuel(input, rng).result;
}

function variance(values: number[]): number {
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

function randomAttribute(rng: ReturnType<typeof makeRng>): number {
	return 1 + Math.floor(rng.next() * 20);
}

function measureWeights(): { rng: number; lane: number; attribute: number } {
	const REFERENCE_COUNT = 2_000;
	const rngShares: number[] = [];
	const laneShares: number[] = [];
	const attributeShares: number[] = [];

	for (let r = 0; r < REFERENCE_COUNT; r++) {
		const seedRng = makeRng(r);
		const refAttackAttr = randomAttribute(seedRng);
		const refDefenseAttr = randomAttribute(seedRng);
		const refChosenLane = randomLane(seedRng);
		const refBettedLane = randomLane(seedRng);

		const rngOnly: number[] = [];
		const laneOnly: number[] = [];
		const attributesOnly: number[] = [];

		for (let s = 0; s < 5; s++) {
			rngOnly.push(
				resolveWith(
					refAttackAttr,
					refDefenseAttr,
					refChosenLane,
					refBettedLane,
					makeRng(r * 100 + s),
				),
			);
		}
		for (const [chosenLane, bettedLane] of [
			['left', 'left'],
			['left', 'right'],
			['center', 'center'],
			['right', 'left'],
			['right', 'right'],
		] as Array<[Lane, Lane]>) {
			laneOnly.push(
				resolveWith(refAttackAttr, refDefenseAttr, chosenLane, bettedLane, makeRng(r)),
			);
		}
		for (const [atk, def] of [
			[4, 4],
			[9, 9],
			[14, 14],
			[18, 18],
			[20, 1],
		]) {
			attributesOnly.push(resolveWith(atk, def, refChosenLane, refBettedLane, makeRng(r)));
		}

		rngShares.push(variance(rngOnly));
		laneShares.push(variance(laneOnly));
		attributeShares.push(variance(attributesOnly));
	}

	const totalRng = rngShares.reduce((a, b) => a + b, 0);
	const totalLane = laneShares.reduce((a, b) => a + b, 0);
	const totalAttribute = attributeShares.reduce((a, b) => a + b, 0);
	const total = totalRng + totalLane + totalAttribute;

	return {
		rng: totalRng / total,
		lane: totalLane / total,
		attribute: totalAttribute / total,
	};
}

function main(): void {
	let hasFailure = false;

	console.log('=== CE-002: calibracion de tasas de exito ===\n');
	for (const band of CALIBRATION_BANDS) {
		const rate = successRate(band.attackAttribute, band.defenseAttribute);
		const inBand = rate >= band.min && rate <= band.max;
		if (!inBand) hasFailure = true;
		const status = inBand ? 'OK' : 'FUERA DE BANDA';
		console.log(
			`${band.label}: ${(rate * 100).toFixed(2)}% (banda [${band.min * 100}-${band.max * 100}]%) -> ${status}`,
		);
	}

	console.log('\n=== CE-003: equilibrio de pesos (INFORMATIVO, no bloqueante) ===\n');
	console.log(
		'No hay formula operacional oficial para "peso" en spec/PRD/skill sim-harness. Esta',
	);
	console.log(
		'medicion usa descomposicion de varianza aislando un factor a la vez, lo cual sobre-pesa',
	);
	console.log(
		'el azar frente al carril (swing fijo de 3 puntos vs banda +-10..+-12, ADR-0001). La medicion',
	);
	console.log(
		'requiere contribucion marginal sobre duelos reales con todos los factores variando a la',
	);
	console.log('vez (pendiente, ver nota en checklists/requirements.md CHK047).\n');
	const weights = measureWeights();
	for (const [key, measured] of Object.entries(weights) as Array<
		[keyof typeof WEIGHT_BANDS, number]
	>) {
		const band = WEIGHT_BANDS[key];
		const inBand = Math.abs(measured - band.target) <= band.tolerance;
		const status = inBand ? 'OK' : 'fuera de banda (no bloqueante)';
		console.log(
			`${band.label}: ${(measured * 100).toFixed(2)}% (objetivo ${(band.target * 100).toFixed(0)}% +-${(band.tolerance * 100).toFixed(0)}pp) -> ${status}`,
		);
	}

	console.log('');
	if (hasFailure) {
		console.error('pnpm sim: una o mas metricas salieron de su banda de calibracion.');
		process.exit(1);
	}
	console.log('pnpm sim: todas las metricas dentro de banda.');
}

main();
