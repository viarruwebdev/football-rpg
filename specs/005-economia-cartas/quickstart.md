# Quickstart — Economía de cartas (spec 005)

Guía de validación end-to-end. No incluye implementación — solo cómo comprobar que la feature funciona una vez implementada.

## Prerrequisitos

```bash
pnpm install
```

Fixtures de cartas de prueba disponibles en `packages/content/src/cards/testFixtures.ts` (Zod-válidas, no el catálogo real).

## Escenario 1 — Determinismo (CE-001)

```ts
import { makeRng } from '@football-rpg/core/rng';
import { createCardEconomyState } from '@football-rpg/core/cards';
import { testDecks } from '@football-rpg/content/cards';

const stateA = createCardEconomyState(testDecks, makeRng(42));
const stateB = createCardEconomyState(testDecks, makeRng(42));
// expect(stateA).toEqual(stateB)
```

Ejecutar un `playMatch` completo con `cardEconomy` poblado dos veces con la misma semilla debe producir el mismo log de eventos (golden replay, ver `match/__tests__/playMatch.golden.test.ts` como referencia de formato).

## Escenario 2 — Agotamiento sin rebarajado (CE-002, CE-003)

```bash
pnpm test -- cards/conservation
```
Property test: para cualquier secuencia arbitraria de robo/juego/descarte (fast-check), `deck.length + hand.length + playedCount` es invariante y ninguna carta jugada reaparece.

Simulación agregada (harness, ver `sim-harness` skill): correr N partidos completos con `--cards` y verificar que el sub-mazo de ataque se vacía en >20% de los partidos (CE-003) y que el sub-mazo defensivo no se agota sistemáticamente antes (CE-004).

## Escenario 3 — Reconversión y jerarquía con improvisación (CE-006, CE-007, CE-010)

```ts
// CE-006: potencia 4 reconvertida → 2, atributo de la fase actual
const converted = convertCard(cardPower4, 'Tackling'); // fase actual = defensa
// expect(converted.effectivePower).toBe(2)
// expect(converted.naturalAttribute).toBe('Tackling')

// CE-007: potencia 1 no reconvertible
// expect(convertCard(cardPower1, 'Tackling')).toBeNull()

// CE-010: jerarquía con improvisación
const eliteImprovised = cardToDuelSide(improvise('attack', 'attack'), /* Finishing 18 → influencia +4 */ 18, 10, []);
// eliteImprovised.cardPower + influence(18) debe ganarle a un portero mediocre
```

## Escenario 4 — Set del portero, uso único (CE-008)

```ts
let set = regenerateGoalkeeperSet({ reflexes: 16, handling: 10, aerialReach: 10, oneOnOnes: 10 });
const first = useGoalkeeperCard(set, 'estirada'); // ok, Reflexes 16 >= 15
const second = useGoalkeeperCard(first.set, 'estirada'); // null: ya usada esta posesión
// second === null, solo queda Parada básica disponible
```

## Escenario 5 — Repliegue como mod, no íntegro (CE-009)

```ts
const withRetreat = cardToDuelSide(playedCard, attribute, composure, [/* pressure, momentum, */ 2]);
// el +2 pasa por applyDiminishing junto al resto — verificar que NO se suma íntegro
// comparar con: applyDiminishing([pressure, momentumMod, 2]) !== pressure + momentumMod + 2 (salvo bruto <=4)
```

## Escenario 6 — Reutilización, no reimplementación (CE-012, CE-013)

```bash
git diff main...HEAD -- packages/core/src/duel/resolveDuel.ts packages/core/src/shot/resolveShot.ts
# debe estar vacío

grep -rn "triangular\|computeBand" packages/core/src/cards/
# no debe encontrar nada (la incertidumbre solo vive en duel/uncertainty.ts)
```

## Escenario 7 — Integración con `playMatch` (RF-022, RF-012/CE-011)

Ejecutar el golden replay existente de la 004 (`playMatch.golden.test.ts`) con `cardEconomy` poblado en vez de `undefined` y confirmar:
1. El test de no-implementación de RF-012 en `possession.test.ts` (drawsCard del éxito aplastante) se rompe al cablear `drawOnCrushingSuccess` y se actualiza a propósito.
2. Las bandas de calibración de la 004 (goles/partido 2.82, banda [2.0, 4.5]) siguen dentro de rango con cartas reales (CE-014) — si se mueven, diagnosticar antes de tocar constantes.

## Cierre de tarea

```bash
pnpm type && pnpm check && pnpm test
pnpm sim   # bandas de calibración intactas, incluida CE-014
```
