import { z } from 'zod';

export const MomentumDuelTableSchema = z.object({
	crushingSuccess: z.number(),
	cleanSuccess: z.number(),
	forcedAdvance: z.number(),
	splitBall: z.number(),
	simpleLoss: z.number(),
	disadvantagedLoss: z.number(),
	devastatingCounter: z.number(),
});

export const momentumDuelResultTable = MomentumDuelTableSchema.parse({
	crushingSuccess: 1,
	cleanSuccess: 0.5,
	forcedAdvance: 0,
	splitBall: 0,
	simpleLoss: -1,
	disadvantagedLoss: -1.5,
	devastatingCounter: -2,
});
