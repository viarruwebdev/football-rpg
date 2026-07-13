import { type GoalkeeperCardData, GoalkeeperCardSchema } from './schema';

const raw: GoalkeeperCardData[] = [
	{
		id: 'parada-basica',
		nombre: 'Parada básica',
		potencia: 3,
		atributoClave: 'Reflexes',
		umbral: null,
		umbralAtributo: null,
	},
	{
		id: 'blocaje',
		nombre: 'Blocaje',
		potencia: 4,
		atributoClave: 'Handling',
		umbral: 13,
		umbralAtributo: 'Handling',
	},
	{
		id: 'despeje-punos',
		nombre: 'Despeje de puños',
		potencia: 4,
		atributoClave: 'Aerial Reach',
		umbral: 15,
		umbralAtributo: 'Aerial Reach',
	},
	{
		id: 'estirada',
		nombre: 'Estirada',
		potencia: 5,
		atributoClave: 'Reflexes',
		umbral: 15,
		umbralAtributo: 'Reflexes',
	},
	{
		id: 'achique',
		nombre: 'Achique',
		potencia: 6,
		atributoClave: 'One on Ones',
		umbral: 17,
		umbralAtributo: 'One on Ones',
	},
];

export const goalkeeperCards: GoalkeeperCardData[] = raw.map((c) => GoalkeeperCardSchema.parse(c));
