import { z } from 'zod';

export const MomentumEventTableSchema = z.record(
	z.enum([
		'goal',
		'tideTurningGoal',
		'specialTechniqueSuccess',
		'epicSave',
		'oneOnOneSave',
		'pressingSteal',
		'possessionStreak',
		'greatSave',
	]),
	z.number(),
);

export const momentumEventTable = MomentumEventTableSchema.parse({
	goal: 2,
	tideTurningGoal: 3,
	specialTechniqueSuccess: 1,
	epicSave: 1,
	oneOnOneSave: 1,
	pressingSteal: 1,
	possessionStreak: 1,
	greatSave: 1,
});
