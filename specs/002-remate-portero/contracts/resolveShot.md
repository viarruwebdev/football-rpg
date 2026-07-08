# Contrato — `resolveShot`

**Módulo**: `packages/core/src/shot/resolveShot.ts`
**Exportado desde**: `packages/core/src/shot/index.ts`

---

## Firma

```ts
import type { Rng } from '../rng/types';
import type { ShotInput, ShotResult } from './types';

export function resolveShot(input: ShotInput, rng: Rng): ShotResult
```

---

## Precondiciones

| Campo | Restricción |
|-------|------------|
| `input.shooter.attribute` | ∈ [1, 20] |
| `input.keeper.attribute` | ∈ [1, 20] |
| `input.shooter.composure` | ∈ [1, 20] |
| `input.keeper.composure` | ∈ [1, 20] |
| `input.shooter.cardPower` | entero ≥ 0 |
| `input.keeper.cardPower` | entero ≥ 0 |
| `input.shooter.modifiers` | array de números (puede ser vacío) |
| `input.keeper.modifiers` | array de números (vacío en v1) |
| `rng` | instancia válida de `Rng` (no null/undefined) |

---

## Postcondiciones

- `result.result` es un entero (entero; `Math.round` en `sampleTriangular`).
- `result.segment` ∈ `ShotSegment` y corresponde exactamente al rango de `result.result`:
  - `unstoppableGoal` ← result ≥ +5
  - `goal` ← result ∈ [+3, +4]
  - `goalOnRebound` ← result ∈ [+1, +2]
  - `greatSave` ← result = 0
  - `solidSave` ← result ∈ [−1, −2]
  - `counterattackSave` ← result ≤ −3
- `result.events` coincide exactamente con el mapeo tramo→eventos de `data-model.md`.
- La función **no muta** `input` ni `rng`.
- Llamar `resolveShot(input, rng)` dos veces con el mismo `rng` da idénticos `result`, `segment` y `events`.

---

## Invariantes de pureza (skill `core-determinism-guard`)

La función y todo lo que llama DEBE:
- No leer `Math.random`, `Date.now`, `new Date`, `performance.now`.
- No acceder a `window`, `document`, `localStorage`, `sessionStorage`, DOM.
- No realizar peticiones de red (`fetch`, `XMLHttpRequest`, `WebSocket`).
- No importar desde `apps/` ni desde la capa UI.
- No mutar argumentos de entrada.

---

## Pipeline interno

```
resolveShot(input, rng)
  │
  ├─ shooterStrength = cardPower + attributeToInfluence(Finishing) + applyDiminishing(applyShotModifiers(ctx))
  ├─ keeperStrength  = cardPower + attributeToInfluence(Reflexes)  + applyDiminishing([])   // v1: mods vacíos
  │
  ├─ differential    = shooterStrength − keeperStrength
  │
  ├─ band            = computeBand(differential, shooter.composure, false)  // isPenalty=false, sin specialTechnique en v1
  ├─ uncertainty     = sampleTriangular(band, rng.split())
  │
  ├─ result          = differential + uncertainty
  ├─ segment         = classifyShot(result)
  └─ events          = emitShotEvents(segment)
```

> `computeBand` recibe `bothSidesHaveSpecialTechnique = false` en v1. El flag `isPenalty` de `ShotInput` es un no-op; en una feature futura activará la lógica de penalti.

---

## Tests requeridos (mínimo)

| ID | Descripción | Tipo |
|----|-------------|------|
| T001 | Mismo `ShotInput` + misma semilla → mismo `ShotResult` | Unitario |
| T002 | Todo `result` cae en exactamente un tramo (sin huecos) | Property (fast-check) |
| T003 | Banda de incertidumbre nunca < ±3 | Property (fast-check) |
| T004 | `asistencia +3` aumenta `shooterStrength` frente a sin ella | Unitario |
| T005 | `disparo desde Medio + LS 16+` da penalización −3 (no −5) | Unitario tabular |
| T006 | `disparo desde Medio + LS 18+` elimina penalización (0) | Unitario tabular |
| T007 | `disparo desde Ataque + LS 18+` elimina penalización (0) | Unitario tabular |
| T008 | Long Shots nunca convierte penalización en bonus (suelo 0) | Property (fast-check) |
| T009 | `greatSave` siempre lleva `hasCorner: true` | Unitario / Property |
| T010 | `solidSave` siempre lleva `roleReversal: true` | Unitario / Property |
| T011 | Portero keeper con `modifiers: []` no produce error | Unitario |
| T012 | Replay dorado: semilla fija → log de eventos fijo (snapshot) | Golden replay |
| T013 | CE-002 harness: élite vs portero mediocre → tasa de gol ∈ [40%, 55%] | Harness |
| T014 | Asimetría: a `result = 0` el tramo es `greatSave` (no gol) | Unitario |
| T015 | Purity guard: `resolveShot` no introduce Math.random / Date.now / DOM | Purity test |
