import type { Rng } from './types';

/**
 * Derives `count` independent child generators from `rng`.
 *
 * `Rng.split()` is a pure, deterministic function of the parent's internal
 * state — calling `rng.split()` twice on the SAME `rng` instance returns two
 * IDENTICAL children, not two independent ones. Independent children must be
 * chained: each child is derived by splitting the previous one, not the
 * original `rng`. Use this helper instead of hand-rolling that chain, to
 * avoid silently reintroducing the correlated-samples bug once fixed in
 * `sampleTriangular` (see ADR-0001).
 */
export function splitN(rng: Rng, count: number): Rng[] {
	const children: Rng[] = [];
	let current = rng;
	for (let i = 0; i < count; i++) {
		current = current.split();
		children.push(current);
	}
	return children;
}
