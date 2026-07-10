# Contrato: `packages/core/src/match` (API pública)

Este proyecto no expone una API HTTP; el "contrato" es la superficie pública del módulo nuevo (`match/`) y la única ampliación de superficie sobre código existente (`momentum/`). Documentado como firmas TypeScript — criterio de aceptación para `tasks.md`/`implement`, junto con `data-model.md`.

## Export barrel: `packages/core/src/match/index.ts`

```ts
// Orquestador principal (RF-015, patrón reductor de la constitución §1)
export function playMatch(initial: MatchState): { state: MatchState; events: MatchEvent[] };
export type { MatchState, MatchClock, MatchPhase, PossessionState, MatchEvent } from './types';

// Reloj (RF-001..RF-004)
export function advanceClock(clock: MatchClock, action: TimeConsumingAction): MatchClock;
export function computeStoppageTime(base: number, contributions: TimeConsumingEvent[]): number;
export type { TimeConsumingAction, TimeConsumingEvent } from './types';

// Posesión (RF-005, RF-006, RF-009c, RF-011)
export function createPossession(attackingSide: MomentumSide): PossessionState;
export function closePossession(
  state: MatchState,
  reason: 'goal' | 'turnover' | 'clockExpired',
): { state: MatchState; events: MatchEvent[] };
export function applyTransition(
  possession: PossessionState,
  transition: PossessionTransition,
): PossessionState;

// Transición de posesión (RF-020) — tabla total sobre los 7 DuelSegment
export function segmentToTransition(segment: DuelSegment): PossessionTransition;
export type { PossessionTransition } from './types';

// Cableado de momentum (RF-007, RF-008, RF-009, RF-009b)
export function buildSituationalModifiers(
  pressure: number,
  momentumBar: number,
  extraModifiers?: number[],
): number[];

// Fin de partido (RF-012, RF-013)
export function handleClockExpiry(state: MatchState): { state: MatchState; events: MatchEvent[] };
```

### Nota A — `segmentToTransition` es total, no parcial

Los 7 valores de `DuelSegment` (`crushingSuccess`, `cleanSuccess`, `forcedAdvance`, `splitBall`, `simpleLoss`, `disadvantagedLoss`, `devastatingCounter` — ya existentes en `duel/types.ts`) mapean 1:1 a una variante de `PossessionTransition` (ver `data-model.md`). No existe un caso `default` ni un `throw` por tramo desconocido: la exhaustividad se verifica en tipos (un `Record<DuelSegment, PossessionTransition>` con las 7 claves obliga al compilador a rechazar cualquier tramo nuevo sin entrada). Ningún test debe necesitar un caso "tramo no mapeado" porque TypeScript ya lo impide en tiempo de compilación.

### Nota B — `buildSituationalModifiers` no reimplementa `applyDiminishing`

```ts
export function buildSituationalModifiers(
  pressure: number,
  momentumBar: number,
  extraModifiers: number[] = [],
): number[] {
  return [pressure, computeMomentumModifier(momentumBar), ...extraModifiers];
}
```

Devuelve el array **bruto** de mods situacionales (RF-007: "el bruto de mods... no se aplica íntegro"). `applyDiminishing` (001, `duel/modifiers.ts`) se invoca **dentro** de `resolveDuel`, no aquí — `match/` nunca llama a `applyDiminishing` directamente; solo construye el array que `DuelSide.modifiers` espera recibir. `extraModifiers` es el punto de extensión para estilo/rol/química (features futuras); en v1 siempre es `[]`.

## Import obligatorio (RF-017 — reutilización, no reimplementación)

```ts
// packages/core/src/match/playMatch.ts
import { resolveDuel } from '../duel';
import type { DuelInput, DuelResult, DuelSegment } from '../duel';
import { resolveShot } from '../shot';
import type { ShotInput, ShotResult } from '../shot';
import {
  applyDuelResult,
  applyEvent,
  computeMomentumModifier,
  degradeAndDetect,
  createMatchMomentumState,
  shotSegmentToMomentumCause,
  resetConsecutiveWins, // AMPLIACIÓN de superficie — ver Nota C
} from '../momentum';
import type { MatchMomentumState, MomentumSide, DegradationContext } from '../momentum';
import type { Rng } from '../rng/types';
```

`resolveDuel.ts` y `resolveShot.ts` no aparecen en el diff de esta feature (CE-010, verificable con `git diff`). `applyEvent`, `applyDuelResult`, `detectThresholdCrossing`, `applyThresholdEffects` tampoco cambian su firma ni su lógica (RF-009c, cláusula explícita de la spec).

### Nota C — la única modificación a código existente

```ts
// packages/core/src/momentum/state.ts (AMPLIACIÓN — nueva función, no reescritura)
export function resetConsecutiveWins(state: MomentumState): MomentumState;
```

Ver `research.md` #2 para el razonamiento de por qué vive en `state.ts` y no dentro de `degradeAndDetect`. Es la única línea de la 004 que toca un archivo ya cerrado por la 003 — se exporta desde `momentum/index.ts` junto al resto de la superficie existente.

**Criterio de aceptación (verificable por diff):** `git diff` sobre `packages/core/src/momentum/` en esta feature solo debe mostrar (a) la función nueva `resetConsecutiveWins` en `state.ts`, y (b) su export en `index.ts`. Ningún otro archivo de `momentum/` cambia.

## Fuera de este contrato (explícitamente, según spec.md)

- El catálogo de cartas/mano que decide qué `DuelInput`/`ShotInput` construir — la 004 recibe la entrada ya resuelta (dobles de prueba en v1; feature de economía de cartas después).
- El pool de jugadores ponderado por mapa de calor.
- Ejecución real de los puntos de extensión declarados como eventos (robo de carta, mini-duelo, bonus de transición, `halftimeActions`) — se emiten, no se resuelven.
- Prórroga, penaltis, córner/penalti como secuencias, faltas/lesiones/sustituciones (el reloj solo acepta sus contribuciones como entrada — `TimeConsumingEvent`).
- Ampliación del harness `tools/sim` para partidos completos — se detalla en `tasks.md` si corresponde a esta feature.
