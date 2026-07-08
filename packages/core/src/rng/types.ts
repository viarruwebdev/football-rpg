export interface Rng {
	/** Returns a float in [0, 1). Does not mutate the receiver. */
	next(): number;
	/** Returns an independent child generator. Does not mutate the receiver. */
	split(): Rng;
}
