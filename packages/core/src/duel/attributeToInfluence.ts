const RANGES: Array<{ max: number; influence: number }> = [
	{ max: 3, influence: -4 },
	{ max: 5, influence: -3 },
	{ max: 7, influence: -2 },
	{ max: 9, influence: -1 },
	{ max: 11, influence: 0 },
	{ max: 13, influence: 1 },
	{ max: 15, influence: 2 },
	{ max: 17, influence: 3 },
	{ max: 20, influence: 4 },
];

export function attributeToInfluence(attribute: number): number {
	const range = RANGES.find((entry) => attribute <= entry.max);
	if (!range) {
		throw new Error(`attribute out of range: ${attribute}`);
	}
	return range.influence;
}
