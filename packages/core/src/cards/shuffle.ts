import type { Rng } from '../rng';

export function shuffleDeck<T>(cards: readonly T[], rng: Rng): T[] {
	const result = [...cards];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rng.next() * (i + 1));
		const tmp = result[i];
		result[i] = result[j]!;
		result[j] = tmp!;
	}
	return result;
}
