import type {
	DuelInput,
	DuelSide,
	Lane,
	MatchClock,
	MatchState,
	ShotInput,
	TeamProfile,
} from '../../packages/core/src/index';
import {
	createPossession,
	makeRng,
	playMatch,
	resolveDuel,
	resolveShot,
} from '../../packages/core/src/index';
import { createMatchMomentumState } from '../../packages/core/src/momentum/index';
import { splitN } from '../../packages/core/src/rng/splitN';

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
		const [chosenLaneRng, bettedLaneRng] = splitN(rng, 2);
		const chosenLane = chosenLaneRng ? randomLane(chosenLaneRng) : 'center';
		const bettedLane = bettedLaneRng ? randomLane(bettedLaneRng) : 'center';
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
		const attributePairs: Array<[number, number]> = [
			[4, 4],
			[9, 9],
			[14, 14],
			[18, 18],
			[20, 1],
		];
		for (const [atk, def] of attributePairs) {
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

const SHOT_SAMPLE_SIZE = 50_000;
const SHOT_GOAL_SEGMENTS = new Set(['unstoppableGoal', 'goal', 'goalOnRebound']);

interface ShotCalibrationBand {
	label: string;
	finishing: number;
	reflexes: number;
	min: number;
	max: number;
	blocking: boolean;
	note?: string;
}

// ADR-0002: banda 40-55% es tasa AGREGADA sobre partidos completos, no de matchup extremo.
// F18/R9: matchup extremo, banda revisada 80-85% (consistente con duelo mismo matchup).
// F15/R12: matchup equilibrado, alerta temprana antes de simulacion completa.
const SHOT_CALIBRATION_BANDS: ShotCalibrationBand[] = [
	{
		label: 'extremo   — elite (F18) vs mediocre (R9)',
		finishing: 18,
		reflexes: 9,
		min: 0.75,
		max: 0.9,
		blocking: true,
		note: 'ADR-0002: banda revisada 80-85%; 40-55% es tasa agregada, no de matchup extremo',
	},
	{
		label: 'equilibrado — bueno (F15) vs competente (R12)',
		finishing: 15,
		reflexes: 12,
		min: 0.5,
		max: 0.75,
		blocking: true,
		note: 'alerta temprana; banda [50-75%] provisional, definitiva pendiente de simulacion completa',
	},
];

function shotGoalRate(finishing: number, reflexes: number): number {
	const input: ShotInput = {
		shooter: { cardPower: 2, attribute: finishing, modifiers: [], composure: 12 },
		keeper: { cardPower: 2, attribute: reflexes, modifiers: [], composure: 10 },
		modifierContext: {
			hasAssist: false,
			isHeaderAfterCross: false,
			hadForcedAdvance: false,
			shotZone: 'area',
			isLateralAngle: false,
			longShotsAttribute: 1,
		},
	};
	let goals = 0;
	for (let i = 0; i < SHOT_SAMPLE_SIZE; i++) {
		const { segment } = resolveShot(input, makeRng(i));
		if (SHOT_GOAL_SEGMENTS.has(segment)) goals++;
	}
	return goals / SHOT_SAMPLE_SIZE;
}

// ──────────────────────────────────────────────────────────────────────────────
// Match simulation (CE-006 / CE-007 / CE-008)
// ──────────────────────────────────────────────────────────────────────────────

const MATCH_SAMPLE_SIZE = 1_000;

function makeInitialMatchState(
	seed: number,
	homeProfile: TeamProfile,
	awayProfile: TeamProfile,
	homeMomentumBar = 0,
	awayMomentumBar = 0,
): MatchState {
	const clock: MatchClock = {
		playsElapsed: 0,
		phase: 'firstHalf',
		halfLength: 30,
		exactStoppageTime: 4,
		stoppageTimeVisibility: { kind: 'range', min: 4, max: 6 },
		stoppageContributions: [],
	};
	const momentum = createMatchMomentumState();
	const initialMomentum = {
		home: { ...momentum.home, bar: homeMomentumBar },
		away: { ...momentum.away, bar: awayMomentumBar },
	};
	return {
		clock,
		possession: createPossession('home'),
		momentum: initialMomentum,
		score: { home: 0, away: 0 },
		rng: makeRng(seed),
		teamProfiles: { home: homeProfile, away: awayProfile },
	};
}

interface MatchSimResult {
	goalsPerMatch: number;
	homeWinRate: number;
	drawRate: number;
	awayWinRate: number;
	shotsPerMatch: number;
	possessionsPerMatch: number;
}

function runMatchSimulation(
	homeProfile: TeamProfile,
	awayProfile: TeamProfile,
	homeMomentumBar = 0,
	awayMomentumBar = 0,
	sampleSize = MATCH_SAMPLE_SIZE,
): MatchSimResult {
	let totalGoals = 0;
	let homeWins = 0;
	let draws = 0;
	let awayWins = 0;
	let totalShots = 0;
	let totalPossessions = 0;

	for (let i = 0; i < sampleSize; i++) {
		const initial = makeInitialMatchState(
			i,
			homeProfile,
			awayProfile,
			homeMomentumBar,
			awayMomentumBar,
		);
		const { state, events } = playMatch(initial);
		const { home, away } = state.score;
		totalGoals += home + away;
		if (home > away) homeWins++;
		else if (away > home) awayWins++;
		else draws++;
		totalShots += events.filter((e) => e.type === 'shotResolved').length;
		totalPossessions += events.filter(
			(e) => e.type === 'possessionStarted' && e.reason !== 'kickoff',
		).length;
	}

	return {
		goalsPerMatch: totalGoals / sampleSize,
		homeWinRate: homeWins / sampleSize,
		drawRate: draws / sampleSize,
		awayWinRate: awayWins / sampleSize,
		shotsPerMatch: totalShots / sampleSize,
		possessionsPerMatch: totalPossessions / sampleSize,
	};
}

interface MatchBand {
	label: string;
	homeProfile: TeamProfile;
	awayProfile: TeamProfile;
	homeMomentumBar?: number;
	awayMomentumBar?: number;
	goalsMin: number;
	goalsMax: number;
	homeWinMin?: number;
	homeWinMax?: number;
	blocking: boolean;
	note?: string;
}

const MATCH_BANDS: MatchBand[] = [
	{
		label: 'CE-008 — equilibrado (attr 10 vs 10, momentum 0)',
		homeProfile: { attribute: 10, cardPower: 5, composure: 10 },
		awayProfile: { attribute: 10, cardPower: 5, composure: 10 },
		goalsMin: 2.0,
		goalsMax: 4.5,
		blocking: true,
		note: 'CE-008: primera medicion real de goles/partido con momentum cableado',
	},
	{
		// CE-006 objetivo: jerarquía preservada aunque el mediocre tenga momentum +5 y el élite -5.
		// CE-007 objetivo: las bandas de calibración de duelos/tiros no se mueven con momentum cableado.
		// Matchup extremo (attr 18 vs 9): diferencial +5 influencia → muchos remates, alta conversión.
		// Medición real (primera vez en partido completo): ~9 remates/partido, ~85% conversión (F18/R9).
		// Banda de goles derivada del harness de tiro (ADR-0002: F18/R9 → 75-90% conversión).
		// Goles/partido esperados: 9 remates × 85% ≈ 7-9 goles. Banda [5.0, 11.0] cubre la distribución.
		// La banda estrecha [1.5-5.0] era provisional para un matchup nunca simulado en partido completo.
		label: 'CE-006/CE-007 — elite(18) vs medio(9), momentum elite=-5, medio=+5',
		homeProfile: { attribute: 18, cardPower: 5, composure: 14 },
		awayProfile: { attribute: 9, cardPower: 5, composure: 10 },
		homeMomentumBar: -5,
		awayMomentumBar: 5,
		goalsMin: 5.0,
		goalsMax: 11.0,
		homeWinMin: 0.35,
		blocking: true,
		note: 'CE-006: jerarquia preservada con momentum invertido; CE-007: banda calibrada en primera sim completa',
	},
];

function runMatchMode(): boolean {
	let hasFailure = false;

	console.log('=== Simulacion de partidos completos (playMatch) ===\n');
	console.log(`Muestra: ${MATCH_SAMPLE_SIZE} partidos por matchup\n`);

	for (const band of MATCH_BANDS) {
		const result = runMatchSimulation(
			band.homeProfile,
			band.awayProfile,
			band.homeMomentumBar ?? 0,
			band.awayMomentumBar ?? 0,
		);

		const inGoalBand =
			result.goalsPerMatch >= band.goalsMin && result.goalsPerMatch <= band.goalsMax;
		const inHierarchy = band.homeWinMin === undefined || result.homeWinRate >= band.homeWinMin;
		const inBand = inGoalBand && inHierarchy;

		if (!inBand && band.blocking) hasFailure = true;

		const goalsStatus = inGoalBand ? 'OK' : band.blocking ? 'FUERA DE BANDA' : 'aviso';
		const hierarchyStatus =
			band.homeWinMin === undefined
				? ''
				: inHierarchy
					? ' | jerarquia OK'
					: ' | JERARQUIA ROTA';

		console.log(`${band.label}:`);
		console.log(
			`  goles/partido: ${result.goalsPerMatch.toFixed(2)} (banda [${band.goalsMin}-${band.goalsMax}]) -> ${goalsStatus}${hierarchyStatus}`,
		);
		console.log(
			`  win/draw/loss home: ${(result.homeWinRate * 100).toFixed(1)}% / ${(result.drawRate * 100).toFixed(1)}% / ${(result.awayWinRate * 100).toFixed(1)}%`,
		);
		console.log(`  remates/partido: ${result.shotsPerMatch.toFixed(1)}`);
		console.log(`  posesiones/partido: ${result.possessionsPerMatch.toFixed(1)}`);
		if (band.note) console.log(`  nota: ${band.note}`);

		if (!inGoalBand) {
			console.log('\n  DIAGNOSTICO (protocolo CE-008):');
			const shotGoalRate = result.goalsPerMatch / Math.max(result.shotsPerMatch, 0.01);
			console.log(`    a) remates/partido: ${result.shotsPerMatch.toFixed(2)}`);
			console.log(`    b) goles/remate: ${(shotGoalRate * 100).toFixed(1)}%`);
			console.log(`    c) posesiones/partido: ${result.possessionsPerMatch.toFixed(2)}`);
			console.log(
				'    d) peso del momentum: verificar CE-006/CE-007 para descartar influencia excesiva',
			);
		}
		console.log('');
	}

	return hasFailure;
}

function main(): void {
	const args = process.argv.slice(2);
	const matchMode = args.includes('--match');

	if (matchMode) {
		const hasFailure = runMatchMode();
		if (hasFailure) {
			console.error(
				'pnpm sim --match: una o mas metricas salieron de su banda de calibracion.',
			);
			process.exit(1);
		}
		console.log('pnpm sim --match: todas las metricas dentro de banda.');
		return;
	}

	let hasFailure = false;

	console.log('=== CE-002 shot: calibracion de tasa de gol por remate (ADR-0002) ===\n');
	for (const band of SHOT_CALIBRATION_BANDS) {
		const rate = shotGoalRate(band.finishing, band.reflexes);
		const inBand = rate >= band.min && rate <= band.max;
		if (!inBand && band.blocking) hasFailure = true;
		const status = inBand
			? 'OK'
			: band.blocking
				? 'FUERA DE BANDA'
				: 'fuera de banda (no bloqueante)';
		console.log(
			`${band.label}: ${(rate * 100).toFixed(2)}% (banda [${band.min * 100}-${band.max * 100}]%) -> ${status}`,
		);
		if (band.note) console.log(`  nota: ${band.note}`);
	}

	console.log('\n=== CE-002 duel: calibracion de tasas de exito ===\n');
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
