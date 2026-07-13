import { z } from 'zod';

export const CardSchema = z.object({
	id: z.string(),
	nombre: z.string(),
	categoria: z.string(),
	potencia: z.number().int().min(0).max(10),
	atributoClave: z.string(),
	rareza: z.enum(['Base', 'Avanzada', 'Élite']),
	costeEnergia: z.number(),
	restriccion: z.string().nullable(),
	fase: z.enum(['A', 'D', 'A/D', 'I', 'P']),
	efectoId: z.string(),
	efectoTexto: z.string(),
});

export type Card = z.infer<typeof CardSchema>;

export const GoalkeeperCardSchema = z.object({
	id: z.string(),
	nombre: z.string(),
	potencia: z.number().int().min(0),
	atributoClave: z.string(),
	umbral: z.number().nullable(),
	umbralAtributo: z.string().nullable(),
});

export type GoalkeeperCardData = z.infer<typeof GoalkeeperCardSchema>;
