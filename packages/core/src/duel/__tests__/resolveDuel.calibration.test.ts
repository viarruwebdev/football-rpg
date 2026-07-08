import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { resolveDuel } from '../resolveDuel';
import type { DuelInput, DuelSide, Lane } from '../types';

const SAMPLE_SIZE = 10_000;
const LANES: Lane[] = ['left', 'center', 'right'];

function makeSide(attribute: number, cardPower: number, composure: number): DuelSide {
	return { cardPower, attribute, modifiers: [], composure };
}

// Defender guesses the attacker's lane correctly 1/3 of the time, as in a
// real match — this keeps the lane mind-game from systematically biasing
// the calibration sample toward attack or defense.
function successRate(attackerAttribute: number, defenderAttribute: number): number {
	let successes = 0;
	for (let i = 0; i < SAMPLE_SIZE; i++) {
		const rng = makeRng(i);
		const laneRng = rng.split();
		const chosenLane = LANES[Math.floor(laneRng.next() * LANES.length)] ?? 'center';
		const bettedLane = LANES[Math.floor(laneRng.split().next() * LANES.length)] ?? 'center';
		const input: DuelInput = {
			attack: { ...makeSide(attackerAttribute, 2, 12), chosenLane },
			defense: { ...makeSide(defenderAttribute, 2, 12), bettedLane },
		};
		const { result } = resolveDuel(input, rng);
		if (result > 0) successes++;
	}
	return successes / SAMPLE_SIZE;
}

// CE-003 has no operational formula in the spec beyond target percentages,
// so weight is measured as variance decomposition: for many reference duels,
// resample one factor at a time (rng only / lane only / attributes+mods only)
// while holding the others fixed, and take each factor's share of the total
// variance across all resamples. Not a spec-mandated algorithm — a reasonable
// interpretation of "relative contribution" given the described factors.
function randomAttribute(rng: ReturnType<typeof makeRng>): number {
	return 1 + Math.floor(rng.next() * 20);
}

function randomLane(rng: ReturnType<typeof makeRng>): Lane {
	return LANES[Math.floor(rng.next() * LANES.length)] ?? 'center';
}

function resolveWith(
	attackAttribute: number,
	defenseAttribute: number,
	chosenLane: Lane,
	bettedLane: Lane,
	rng: ReturnType<typeof makeRng>,
): number {
	const input: DuelInput = {
		attack: { ...makeSide(attackAttribute, 2, 12), chosenLane },
		defense: { ...makeSide(defenseAttribute, 2, 12), bettedLane },
	};
	return resolveDuel(input, rng).result;
}

function variance(values: number[]): number {
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

describe('resolveDuel weight balance (CE-003)', () => {
	it('rng / lane / attributes each contribute a bounded share of result variance', () => {
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
				const sampleRng = makeRng(r * 100 + s);
				rngOnly.push(
					resolveWith(
						refAttackAttr,
						refDefenseAttr,
						refChosenLane,
						refBettedLane,
						sampleRng,
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
				attributesOnly.push(
					resolveWith(atk, def, refChosenLane, refBettedLane, makeRng(r)),
				);
			}

			rngShares.push(variance(rngOnly));
			laneShares.push(variance(laneOnly));
			attributeShares.push(variance(attributesOnly));
		}

		const totalRng = rngShares.reduce((a, b) => a + b, 0);
		const totalLane = laneShares.reduce((a, b) => a + b, 0);
		const totalAttribute = attributeShares.reduce((a, b) => a + b, 0);
		const total = totalRng + totalLane + totalAttribute;

		const rngWeight = totalRng / total;
		const laneWeight = totalLane / total;
		const attributeWeight = totalAttribute / total;

		// Wide bands: this is a coarse structural signal, not a precise
		// calibration gate — it only fails if one factor totally dominates
		// or is entirely absent, which would indicate a pipeline wiring bug.
		expect(rngWeight).toBeGreaterThan(0.05);
		expect(laneWeight).toBeGreaterThan(0.05);
		expect(attributeWeight).toBeGreaterThan(0.05);
		expect(rngWeight + laneWeight + attributeWeight).toBeCloseTo(1, 5);
	});
});

describe('resolveDuel calibration (CE-002)', () => {
	it('elite attacker (18) beats mediocre defender (9) 80-85% of the time', () => {
		const rate = successRate(18, 9);
		expect(rate).toBeGreaterThanOrEqual(0.8);
		expect(rate).toBeLessThanOrEqual(0.85);
	});

	it('elite attacker (18) beats poor defender (4) 90-95% of the time', () => {
		const rate = successRate(18, 4);
		expect(rate).toBeGreaterThanOrEqual(0.9);
		expect(rate).toBeLessThanOrEqual(0.95);
	});

	it('good attacker (14) vs good defender (14) is roughly balanced (45-55%)', () => {
		const rate = successRate(14, 14);
		expect(rate).toBeGreaterThanOrEqual(0.45);
		expect(rate).toBeLessThanOrEqual(0.55);
	});
});
