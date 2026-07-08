import type { Rng } from './types';

const SPLIT_MIX = 0x9e_37_79_b9;

function step(state: number): { value: number; nextState: number } {
	const nextState = (state + 0x6d_2b_79_f5) >>> 0;
	let t = nextState;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	const value = ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	return { value, nextState };
}

function fromState(state: number): Rng {
	return {
		next(): number {
			return step(state).value;
		},
		split(): Rng {
			const mixedState = (state ^ SPLIT_MIX) >>> 0;
			const { nextState } = step(mixedState);
			return fromState(nextState);
		},
	};
}

export function makeRng(seed: number): Rng {
	return fromState(seed >>> 0);
}
