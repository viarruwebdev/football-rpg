# Quickstart: validar la cadena de posesión y el reloj de partido (004)

Guía de validación end-to-end una vez implementado. No sustituye a `tasks.md` (el cómo se construye); esto es el cómo se comprueba que funciona.

## Prerrequisitos

- Rama `004-cadena-posesion` con `packages/core/src/match/` implementado según `data-model.md` y `contracts/match-module.md`.
- `resetConsecutiveWins` añadido a `packages/core/src/momentum/state.ts` y exportado (ver `research.md` #2, `contracts/match-module.md` Nota C).
- 001, 002 y 003 mergeados en `main` sin cambios pendientes.

## Setup

```bash
pnpm install
pnpm type   # tsc --build --force — debe estar en verde antes de tocar tests
```

## Escenarios de validación (mapeados a las 4 historias de usuario de spec.md)

### 1. Una posesión avanza por la cadena hasta rematar o perderse (Historia 1, P1)

```bash
pnpm test packages/core/src/match/__tests__/transition.test.ts
pnpm test packages/core/src/match/__tests__/possession.test.ts
```

**Caso de aceptación de la spec:** cada duelo consume 1 jugada; el primer eslabón no tiene presión, el cuarto tiene +3; un éxito avanza de franja, una pérdida cierra la posesión.

```ts
import { createPossession, applyTransition, segmentToTransition } from '@football-rpg/core';

let possession = createPossession('home');
// possession.accumulatedPressure === 0

possession = applyTransition(possession, segmentToTransition('forcedAdvance')); // eslabón 1
possession = applyTransition(possession, segmentToTransition('forcedAdvance')); // eslabón 2
possession = applyTransition(possession, segmentToTransition('forcedAdvance')); // eslabón 3
possession = applyTransition(possession, segmentToTransition('forcedAdvance')); // eslabón 4
// possession.accumulatedPressure === 3 (manual §3: "el cuarto eslabón tiene +3 de bonus acumulado")
```

### 2. El momentum afecta por fin a los duelos (Historia 2, P1)

```bash
pnpm test packages/core/src/match/__tests__/momentumWiring.test.ts
```

**Caso de aceptación de la spec:** con momentum +5, el bruto de mods de `resolveDuel` incluye +0.75.

```ts
import { buildSituationalModifiers } from '@football-rpg/core';

const mods = buildSituationalModifiers(/* pressure */ 2, /* momentumBar */ 5);
// mods === [2, 0.75]
// applyDiminishing(mods) se invoca DENTRO de resolveDuel, no aquí (ver contracts, Nota B)
```

### 3. El reloj es un recurso compartido (Historia 3, P1)

```bash
pnpm test packages/core/src/match/__tests__/clock.test.ts
pnpm test packages/core/src/match/__tests__/clock.property.test.ts
```

**Casos de aceptación:** 30 jugadas primera parte, 30 segunda, descuento 4-8; el reloj no se pausa en la inversión de roles; el descuento se deriva de los eventos consumidores de tiempo; el reloj nunca retrocede y `phase` solo avanza `firstHalf → secondHalf → stoppage` (CE-015).

### 4. El robo invierte los roles limpiamente (Historia 4, P2)

```bash
pnpm test packages/core/src/match/__tests__/possession.test.ts
pnpm test packages/core/src/match/__tests__/transition.test.ts -t pressingSteal
```

**Caso de aceptación — `pressingSteal` no invertido (CE-014, el error más probable):**

```ts
// Robo en franja Defensa del atacante (zona avanzada de quien roba) → SÍ pressingSteal
// Robo en franja Área del atacante (el que roba defiende su portería) → NO pressingSteal
```

### 5. Determinismo de partido completo (CE-001)

```bash
pnpm test packages/core/src/match/__tests__/playMatch.golden.test.ts
```

```ts
import { playMatch, createInitialMatchState } from '@football-rpg/core';
import { createRng } from '@football-rpg/core'; // o el constructor real del PRNG sembrado

const initial = createInitialMatchState({ seed: 42 });
const run1 = playMatch(initial);
const run2 = playMatch(createInitialMatchState({ seed: 42 }));
// run1.events y run2.events son idénticos (golden replay)
// run1.state.score y run2.state.score son idénticos
```

### 6. Casos límite de fin de partido (RF-012, RF-013)

```bash
pnpm test packages/core/src/match/__tests__/endgame.test.ts
```

**Casos de aceptación:** reloj a 0 durante una posesión completa el duelo en curso (y el remate si resulta en uno); "último suspiro" concede exactamente 1 duelo extra al atacante que va perdiendo, nunca un segundo; sin último suspiro si el atacante va ganando o empatando.

## Puerta de calidad completa (antes de dar la feature por cerrada)

```bash
pnpm type    # sin errores
pnpm check   # biome sin fixes pendientes
pnpm test    # todos los tests verdes, incluidos los nuevos de packages/core/src/match
pnpm sim     # CE-006/CE-007/CE-008: jerarquía preservada + bandas de 001/002 intactas +
             #   banda provisional [2.0, 4.5] goles/partido en matchup equilibrado (F15/R12)
```

**CE-008 es el criterio más caro de falsear a mano** y el único que juzga el motor completo. Si `pnpm sim` sale de la banda `[2.0, 4.5]` en el matchup equilibrado, el diagnóstico es obligatorio antes de tocar ninguna constante: aislar si el desvío viene de (a) la tasa de gol del remate (bandas provisionales de 002/ADR-0002), (b) la duración media de posesiones/número de remates por partido, (c) el cap de momentum, o (d) el reloj. Solo con el diagnóstico completo se abre ADR-0003.

## Verificación de determinismo y aislamiento (core-determinism-guard)

```bash
grep -rnE "Math\.random|Date\.now|new Date|performance\.now|fetch\(|window\.|document\.|localStorage|sessionStorage" packages/core/src/match \
  && echo "❌ posible no-determinismo en match" || echo "✅ match limpio"

grep -rnE "from ['\"](\.\.\/)*(apps|ui)" packages/core/src/match \
  && echo "❌ match importa de la UI" || echo "✅ dependencias correctas"
```

## Verificación de `Rng.split()` una vez por duelo (RF-015, instrucción explícita del usuario)

```bash
grep -n "rng\.split()" packages/core/src/match/playMatch.ts
# debe aparecer exactamente una vez por punto de invocación de resolveDuel/resolveShot,
# nunca un rng.next() directo sobre state.rng dentro de playMatch.ts
```

## Verificación de no-reimplementación (CE-009, CE-010)

```bash
git diff main...004-cadena-posesion -- packages/core/src/duel/resolveDuel.ts packages/core/src/shot/resolveShot.ts
# debe salir vacío: RF-018 prohíbe tocar estos archivos (CE-010)

git diff main...004-cadena-posesion -- packages/core/src/momentum/ | grep -v "state.ts\|index.ts"
# debe salir vacío: la única modificación a momentum/ es resetConsecutiveWins (contracts, Nota C)

grep -rn "function applyDiminishing\|function resolveDuel\|function resolveShot" packages/core/src/match
# debe salir vacío: ninguno se reimplementa dentro de match/
```
