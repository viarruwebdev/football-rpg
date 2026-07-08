---
name: card-authoring
description:
  Cómo crear, validar y añadir una carta del Football RPG como DATO declarativo
  validado con Zod en packages/content, nunca como lógica en el motor. Cubre el
  esquema de una carta (potencia, atributo clave, rareza, coste de energía,
  restricción, fase, efecto), el sistema de efectos híbrido (datos + handler
  registrado) y las notas de balance del catálogo. Úsala al añadir o editar
  cartas, diseñar contenido nuevo, o cablear el efecto de una carta. Palabras
  clave: carta, catálogo, contenido, Zod, potencia, rareza, fase, efecto, handler.
---

# Autoría de cartas — Football RPG

Las cartas son **datos**, no código (constitución, Principio 4). Viven en `packages/content`, se validan con Zod, y su lógica se conecta mediante *handlers* registrados por identificador. Añadir una carta NO debe requerir tocar `packages/core`.

## Anatomía de una carta (leyenda del catálogo)

- **id**: estable y único (p. ej. `P02`, `D04`, `GK03`, `TE01`, `TC05`, `ROL09`).
- **nombre**: el del manual.
- **potencia**: valor base 1-10 (las de utilidad pura pueden ser 0; los instantes que suman usan `+N`).
- **atributoClave**: stat que se suma vía compresión en la resolución (Passing, Dribbling, Finishing, Tackling, Reflexes, Free Kick…).
- **rareza**: `Base` | `Avanzada` | `Élite`. Determina qué jugadores la aportan al mazo.
- **costeEnergia**: 0 por defecto; las técnicas especiales siempre cuestan (2-4).
- **restriccion**: condición para jugarla (zona/franja, eslabón previo, rol, umbral de atributo, "1 vez por partido"…). `null` si ninguna.
- **fase**: `A` (ataque) | `D` (defensa) | `A/D` (ambas) | `I` (instante) | `P` (portero).
- **efecto**: descripción legible + referencia al handler.

## Esquema Zod (esqueleto)

```ts
// packages/content/src/schema/card.ts
import { z } from "zod";

export const Rareza = z.enum(["Base", "Avanzada", "Élite"]);
export const Fase = z.enum(["A", "D", "A/D", "I", "P"]);

export const CardSchema = z.object({
  id: z.string().regex(/^[A-Z]+\d+$/),         // P02, GK03, TE01…
  nombre: z.string().min(1),
  categoria: z.enum([
    "pase", "regate", "tiro", "centro", "tactica", "defensa",
    "portero", "instante", "balonParado", "tecnicaEspecial",
    "combinada", "rol",
  ]),
  potencia: z.number().int().min(0).max(10),
  atributoClave: z.string(),                   // valida contra el catálogo de atributos
  rareza: Rareza,
  costeEnergia: z.number().int().min(0).max(4).default(0),
  restriccion: z.string().nullable().default(null),
  fase: Fase,
  efectoId: z.string(),                         // referencia al handler registrado
  efectoTexto: z.string(),                      // descripción para la UI
});
export type Card = z.infer<typeof CardSchema>;
```

## Sistema de efectos híbrido

El **dato** dice *qué* carta es; el **handler** dice *cómo* actúa. Nada de `if (card.id === "P02")` disperso por el motor.

```ts
// packages/core/src/effects/registry.ts
type EffectHandler = (ctx: DuelContext) => DuelPatch;
const registry = new Map<string, EffectHandler>();
export const registerEffect = (id: string, h: EffectHandler) => registry.set(id, h);
export const getEffect = (id: string) => registry.get(id) ?? identityEffect;
```

Cada carta referencia un `efectoId`; el handler se registra una vez y el motor lo busca. Cartas sin efecto especial usan `identity`.

## Reglas de balance del catálogo (no las violes al crear cartas)

- **Cap de bonus externo acumulado: +5.** El exceso se ignora.
- **Cap de transición: +5.**
- **Técnicas especiales:** máx. 1 por eslabón; no se apilan con instantes que sumen potencia (Último esfuerzo no aplica sobre técnica especial).
- **Cartas de rol:** exclusivas del rol; cambiar de rol entre partidos cambia la carta.
- **"1 vez por partido":** se elimina del mazo tras usarse.
- **Distribución de mazo típico (30-35 cartas):** ~40% Base, ~35% Avanzada, ~15% Élite, ~10% técnicas/combinadas/rol.
- **Suelos de mazo:** ataque mín. 14 cartas, defensa mín. 8 (se rellena con genéricas potencia 1 si el equipo no aporta).

## Flujo para añadir una carta

1. Escribe el dato validado con `CardSchema` en el módulo de su categoría.
2. Si tiene efecto especial, registra su `efectoId` con un handler puro (sin azar salvo el PRNG del contexto, sin I/O).
3. Añade un test: la carta pasa la validación Zod y su handler produce el `DuelPatch` esperado con una semilla fija.
4. Corre `pnpm sim` si el cambio puede alterar el balance agregado (ver skill `sim-harness`).

## Qué NO hacer

- No meter lógica de la carta en el motor con condicionales por id.
- No exceder los caps de balance ni los rangos de potencia.
- No usar aleatoriedad fuera del PRNG del contexto de duelo.
- No añadir una carta sin su validación Zod y su test.