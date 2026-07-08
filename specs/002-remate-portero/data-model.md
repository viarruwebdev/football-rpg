# Modelo de datos — Remate contra el portero

**Feature**: 002-remate-portero | **Fecha**: 2026-07-08

---

## Entidades nuevas (en `packages/core/src/shot/types.ts`)

### `ShotMomentumCause`

```ts
export type ShotMomentumCause = 'goal' | 'goalOnRebound' | 'greatSave';
```

Causa semántica del evento de momentum. La magnitud numérica la aplica el sistema de momentum, no el resolvedor (ver R-003 de research.md).

---

### `ShotSegment`

```ts
export type ShotSegment =
  | 'unstoppableGoal'    // Resultado ≥ +5
  | 'goal'               // Resultado +3..+4
  | 'goalOnRebound'      // Resultado +1..+2  (es gol según §6)
  | 'greatSave'          // Resultado = 0     (paradón, córner)
  | 'solidSave'          // Resultado −1..−2  (parada sólida, inversión de roles)
  | 'counterattackSave'; // Resultado ≤ −3    (parada y contragolpe)
```

**Invariante**: todo número entero cae en exactamente un tramo (sin huecos ni solapes). Verificable con property-based test.

---

### `ShotEvent`

```ts
export type ShotEvent =
  | { type: 'goal' }
  | { type: 'goalOnRebound' }
  | { type: 'greatSave'; hasCorner: true }
  | { type: 'solidSave'; roleReversal: true }
  | { type: 'counterattackSave' }
  | { type: 'momentum'; side: 'attack' | 'defense'; cause: ShotMomentumCause };
```

Discriminated union separado de `DuelEvent`. El evento `momentum` **no lleva `delta`**: es semántico, la magnitud la resuelve el sistema de momentum a partir de `cause`.

**Mapeo tramo → eventos** (verificado contra §6, tabla "Umbrales de resultado — Remate"):

| Tramo | Eventos emitidos |
|-------|-----------------|
| `unstoppableGoal` | `goal` + `momentum{attack, 'goal'}` |
| `goal` | `goal` + `momentum{attack, 'goal'}` |
| `goalOnRebound` | `goalOnRebound` + `momentum{attack, 'goalOnRebound'}` |
| `greatSave` | `greatSave{hasCorner:true}` + `momentum{defense, 'greatSave'}` |
| `solidSave` | `solidSave{roleReversal:true}` (sin momentum — §6 no lo indica) |
| `counterattackSave` | `counterattackSave` (sin momentum — §6 no lo indica) |

> **Nota**: `unstoppableGoal` y `goal` emiten el mismo conjunto de eventos; la distinción de tramo es narrativa/UI, no mecánica.

---

### `ShotSide`

```ts
export interface ShotSide {
  /** Base power of the card played. */
  cardPower: number;
  /** Player's key attribute (1-20): Finishing for shooter, Reflexes for keeper. */
  attribute: number;
  /**
   * Situational modifiers (diminishing-returns pool).
   * Shooter: shot modifiers from applyShotModifiers.
   * Keeper: empty [] in v1; extension point for future mods (momentum, style, fatigue).
   */
  modifiers: number[];
  /** Player's Composure (1-20). Passed to computeBand for uncertainty adjustment. */
  composure: number;
}
```

Sin carril (`chosenLane`/`bettedLane`): no hay mind-game en remates normales (§6). Sin `specialTechnique`: fuera del alcance de la 002.

---

### `ShotModifierContext`

```ts
export interface ShotModifierContext {
  /** +3 if the shot is preceded by an assist. */
  hasAssist: boolean;
  /** +2 if it is a header after a cross. */
  isHeaderAfterCross: boolean;
  /** −2 if the attacking chain had a forced advance before the shot. */
  hadForcedAdvance: boolean;
  /** Zone from which the shot is taken. Determines distance penalty. */
  shotZone: 'area' | 'attack' | 'midfield';
  /** Lateral angle penalty: −2 if shooting from the lateral edge of the area. */
  isLateralAngle: boolean;
  /** Shooter's Long Shots attribute (1-20). Used to mitigate distance penalty. */
  longShotsAttribute: number;
}
```

`applyShotModifiers(ctx: ShotModifierContext): number[]` devuelve la lista de modificadores brutos que entra en `applyDiminishing`. La llamada a `applyDiminishing` la hace `resolveShot`.

**Tabla de mods brutos** (fuente: §6 y R-004 de research.md):

| Condición | Mod bruto |
|-----------|-----------|
| Asistencia previa | +3 |
| Cabezazo tras centro | +2 |
| Avance forzado previo | −2 |
| Disparo desde Ataque | −3 |
| Disparo desde Medio | −5 |
| Disparo desde Área | 0 (sin penalización) |
| Long Shots 16+ (mitiga disparo lejano) | +2 (reduce el mod de distancia en 2) |
| Long Shots 18+ (elimina penalización) | elimina el mod de distancia |
| Ángulo lateral del Área | −2 |

> **Implementación**: `applyShotModifiers` calcula `distancePenalty` (0, −3 o −5 según zona), aplica la mitigación de Long Shots con suelo 0, y devuelve la lista de valores que entran en `applyDiminishing`. El suelo garantiza que Long Shots no convierte la penalización en bonus.

---

### `ShotInput`

```ts
export interface ShotInput {
  shooter: ShotSide;
  keeper: ShotSide;
  modifierContext: ShotModifierContext;
  /** v1 no-op extension point. True if penalty (future feature). */
  isPenalty?: boolean;
}
```

---

### `ShotResult`

```ts
export interface ShotResult {
  /** Integer value: differential + uncertainty. */
  result: number;
  /** Segment the result falls into. */
  segment: ShotSegment;
  /** Events to dispatch to upper layers, in order. */
  events: ShotEvent[];
}
```

---

## Entidades reutilizadas (sin cambios, importadas de `packages/core/src/duel/`)

| Símbolo | Origen | Rol en la feature 002 |
|---------|--------|------------------------|
| `attributeToInfluence` | `duel/attributeToInfluence.ts` | Convierte Finishing/Reflexes 1-20 → −4..+4 |
| `applyDiminishing` | `duel/modifiers.ts` | Aplica rendimientos decrecientes a la lista de mods |
| `computeBand` | `duel/uncertainty.ts` | Calcula la banda de incertidumbre (10/11/12, ajuste Composure) |
| `sampleTriangular` | `duel/uncertainty.ts` | Muestrea la triangular dado un `Rng` hijo |
| `Rng` | `rng/types.ts` | Contrato del PRNG splittable; entra como argumento en `resolveShot` |

No se reimplementa ninguno de estos símbolos en `packages/core/src/shot/`.

---

## Invariantes y reglas de validación

- `attribute` ∈ [1, 20] para shooter y keeper.
- `composure` ∈ [1, 20] para ambos lados.
- `cardPower` ≥ 0 (entero).
- `modifiers[]` puede estar vacío (portero en v1 llega con `[]`).
- `result` es entero (consecuencia de `Math.round` en `sampleTriangular`).
- Todo `result` cae en exactamente un `ShotSegment` (propiedad fast-check).
- La banda de incertidumbre nunca es < ±3 (suelo `BAND_FLOOR`, heredado de 001).
- `greatSave` siempre lleva `hasCorner: true`; `solidSave` siempre lleva `roleReversal: true` (no son opcionales: el §6 los asocia al tramo sin condición adicional).
