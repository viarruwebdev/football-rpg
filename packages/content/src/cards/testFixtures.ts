import { type Card, CardSchema } from './schema';

const base = {
	categoria: 'test',
	rareza: 'Base' as const,
	costeEnergia: 0,
	restriccion: null,
	efectoId: 'noop',
	efectoTexto: '',
	atributoClave: 'Passing',
};

const raw: Card[] = [
	{ ...base, id: 'atk-3', nombre: 'Ataque 3', potencia: 3, fase: 'A' },
	{
		...base,
		id: 'atk-5',
		nombre: 'Ataque 5',
		potencia: 5,
		fase: 'A',
		atributoClave: 'Dribbling',
	},
	{
		...base,
		id: 'def-2',
		nombre: 'Defensa 2',
		potencia: 2,
		fase: 'D',
		atributoClave: 'Tackling',
	},
	{
		...base,
		id: 'def-4',
		nombre: 'Defensa 4',
		potencia: 4,
		fase: 'D',
		atributoClave: 'Tackling',
	},
	{ ...base, id: 'shared-1', nombre: 'Compartida', potencia: 2, fase: 'I' },
	{ ...base, id: 'util-0', nombre: 'Utilidad pura', potencia: 0, fase: 'A/D' },
];

export const testCards: Card[] = raw.map((c) => CardSchema.parse(c));

export const attackCard = (potencia: number, id = `atk-${potencia}`): Card =>
	CardSchema.parse({ ...base, id, nombre: `Atk ${potencia}`, potencia, fase: 'A' });

export const defenseCard = (potencia: number, id = `def-${potencia}`): Card =>
	CardSchema.parse({
		...base,
		id,
		nombre: `Def ${potencia}`,
		potencia,
		fase: 'D',
		atributoClave: 'Tackling',
	});

export const sharedCard = (potencia = 2, id = 'shared-test'): Card =>
	CardSchema.parse({ ...base, id, nombre: 'Shared', potencia, fase: 'I' });

export const zeroPowerCard = (): Card =>
	CardSchema.parse({ ...base, id: 'zero-power', nombre: 'Zero', potencia: 0, fase: 'A/D' });
