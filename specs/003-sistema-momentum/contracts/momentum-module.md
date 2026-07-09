# Contrato: `packages/core/src/momentum` (API pública)

Este proyecto no expone una API HTTP; el "contrato" es la superficie pública del módulo que consumirá la capa de partido (004). Se documenta como firmas TypeScript — son el criterio de aceptación para `tasks.md`/`implement`, junto con las tablas de umbral de `data-model.md`.

## Export barrel: `packages/core/src/momentum/index.ts`

```ts
// Estado
export function createMomentumState(): MomentumState;
export type { MomentumState, MomentumThreshold, PlayerInTheZone } from './types';

// Par de barras de un partido. La 003 define este contenedor porque
// detectThresholdCrossing (ver abajo) lo necesita para resolver "en la
// zona" ganado por el −5 del rival sin depender de la capa de partido.
export function createMatchMomentumState(): MatchMomentumState;
export type { MatchMomentumState, MomentumSide } from './types'; // MomentumSide: 'home' | 'away'

// Consumo de eventos de remate (RF-001) — única entrada aceptada: causa
// semántica. DuelEvent ya no tiene variante 'momentum' (ver research.md #2);
// solo ShotEvent.momentum llega por esta vía. El nombre y el tipo del
// parámetro son deliberadamente distintos de applyDuelResult (ver Nota A):
// no existe ninguna firma que acepte "un resultado de duelo cualquiera" y
// decida internamente qué tabla usar por el VALOR del resultado. La tabla
// se elige por CUÁL función se invoca, no por lo que se le pasa.
export function applyEvent(
  state: MomentumState,
  cause: MomentumEventCause,
): MomentumState;
export type { MomentumEventCause } from './types';

// Consumo de resultados de duelo de eslabón (RF-002, RF-006). `DuelSegment`
// y `MomentumEventCause` son uniones de strings disjuntas (sin solape de
// literales) — pasar un DuelSegment a applyEvent, o una MomentumEventCause
// a applyDuelResult, es un error de tipos, no un caso a validar en runtime.
export function applyDuelResult(
  state: MomentumState,
  segment: DuelSegment, // importado de '../duel', no redefinido
): MomentumState;

// Modificador de Fuerza (RF-004, RF-005)
export function computeMomentumModifier(bar: number): number; // clamp(0.15*bar, -0.75, 0.75)

// Umbrales (RF-007, RF-008) — opera sobre el MatchMomentumState COMPLETO
// (ambos equipos), no sobre un MomentumState aislado. Resuelve los tres
// caminos por sí sola, sin ayuda de 004: ±3, ±4 (mecánicos, cada uno mira
// solo su propio equipo), +5 propio ('ownPeak': 'enteredTheZone' +
// 'perfectPlayUnlocked') y −5 propio ('rivalTrough' a favor del OTRO
// equipo: 'enteredTheZone' sin 'perfectPlayUnlocked'). `movedSide` indica
// cuál de las dos barras acaba de cambiar en este before/after — la función
// decide sola a qué MomentumState del par escribe cada efecto (ver Nota B).
// Devuelve también `ThresholdReset[]`: umbrales que se des-activan porque la
// barra bajó por debajo del umbral inmediatamente inferior. `applyThresholdEffects`
// los quita del `crossedThresholds` Set sin recalcular nada — firma limpia sin
// necesidad de recibir `barBefore`/`barAfter` de nuevo en el siguiente paso.
export function detectThresholdCrossing(
  before: MatchMomentumState,
  after: MatchMomentumState,
  movedSide: MomentumSide,
): { effects: ThresholdEffect[]; resets: ThresholdReset[] };
export type { ThresholdEffect, ThresholdReset } from './types';

// Efectos de umbral (parte del orquestador updateMomentum; también exportada para
// que 004 pueda aplicar efectos de forma granular si lo necesita).
// Recibe los `resets` devueltos por detectThresholdCrossing y los aplica al Set
// de `crossedThresholds` — elimina los umbrales bajados, añade los cruzados,
// consume el cupo de "en la zona".
export function applyThresholdEffects(
  state: MomentumState,
  effects: ThresholdEffect[],
  resets: ThresholdReset[],
  side: MomentumSide,
): MomentumState;

// Orquestador: encadena applyEvent/applyDuelResult (ya ejecutado) →
// detectThresholdCrossing → applyThresholdEffects para ambos lados.
// Uso típico por 004:
//   const barState = applyEvent(match.home, 'goal');
//   const { match: next, effects } = updateMomentum(match, 'home', barState);
export function updateMomentum(
  match: MatchMomentumState,
  movedSide: MomentumSide,
  newBarState: MomentumState,
): { match: MatchMomentumState; effects: ThresholdEffect[] };

// Degradación (RF-011) — pura, la invoca la capa de partido (004), no 003 internamente
export function degradeMomentum(
  state: MomentumState,
  context: DegradationContext,
): MomentumState;
export interface DegradationContext {
  hadSignificantEventOrWin: boolean;
  determinationAverage: number;
  traitHook?: TraitHook; // RF-017, punto de extensión, sin uso interno en v1
}

// Punto de extensión de rasgos (RF-017)
export type { TraitHook, TraitHookContext } from './types';
```

### Nota A — la exclusividad de tablas es un contrato de tipos, no de valores

**La distinción entre tabla de eventos y tabla de duelos NO la hace el valor del resultado. La hace el tipo de duelo que lo produjo** (RF-001, cláusula añadida). Un resultado de `0` significa "balón dividido" si viene de un duelo de eslabón (`DuelSegment = 'splitBall'`, no mueve momentum) y significa "paradón estándar" si viene de un remate (`MomentumEventCause = 'greatSave'`, +1 defensor) — son el mismo número, dos efectos opuestos, y la spec los distingue exclusivamente por **cuál función del contrato se invoca**, nunca por inspeccionar `result === 0`.

Esto se impone en el tipo, no solo en prosa:
- `applyEvent(state, cause: MomentumEventCause)` — única vía para `ShotEvent.momentum` (002): gol, paradón estándar, y el resto de causas de la tabla de eventos.
- `applyDuelResult(state, segment: DuelSegment)` — única vía para duelos de eslabón (001): los 6 tramos de la tabla de duelos, incluido `splitBall`.

`MomentumEventCause` y `DuelSegment` son uniones de strings **sin ningún literal en común** (`'greatSave'` no es un `DuelSegment`; `'splitBall'` no es un `MomentumEventCause`). No existe una tercera función `applyResult(state, result: number)` que reciba un número crudo y decida la tabla por su valor — esa firma es precisamente lo que RF-001 prohíbe, porque invitaría a implementarla con `if (result === 0)` y confundiría balón dividido con paradón estándar. `DuelEvent` ya no tiene variante `momentum` (eliminada en esta feature, ver research.md #2): la única entrada que combina "resultado + tabla" que existía antes de esta feature ya no existe.

Internamente, `applyEvent`:
- Busca el delta en `MomentumEventTable` (packages/content) por `cause`.
- Aplica la regla condicional de `tideTurningGoal` (solo si `state.bar < 0`) antes de sumar — esta causa no proviene de `ShotEvent` directamente, la deriva 004 al detectar gol con `state.bar < 0` (fuera de alcance de 003, documentado en `spec.md`).

`MomentumEventCause` reutiliza directamente los nombres de `ShotMomentumCause` donde ya existen en el código (`'goal'`, `'greatSave'`) — no hay vocabulario paralelo ni tabla de traducción que mantener. `'goalOnRebound'` colapsa en `'goal'` (mismo delta de momentum, +2/−2; el tramo de rebote solo importa para el log de eventos de partido, no para el momentum). Las 6 causas sin origen en `ShotMomentumCause` (`tideTurningGoal`, `specialTechniqueSuccess`, `epicSave`, `oneOnOneSave`, `pressingSteal`, `possessionStreak`) las deriva 004 de otras señales del ciclo de posesión. Ver `data-model.md §MomentumEventCause` para la lista completa y el recuento de cobertura (9 filas de la §7 → 8 identificadores).

## Import obligatorio (RF-016 — reutilización, no reimplementación)

```ts
// packages/core/src/momentum/modifier.ts
import { applyDiminishing } from '../duel'; // ya exportado en duel/index.ts

// packages/core/src/momentum/duelResult.ts (o donde se necesite el tipo)
import type { DuelSegment } from '../duel';

// packages/core/src/momentum/events.ts
import type { ShotMomentumCause } from '../shot'; // referencia de tipos; MomentumEventCause reutiliza sus nombres, no los traduce
```

`Rng` NO se importa en el módulo de momentum: en v1 la degradación y todas las funciones de 003 son deterministas sin azar. Si un rasgo futuro introduce aleatoriedad, entra por `TraitHook` (RF-017), que recibe `Rng` como parte de su contexto en la capa de partido (004) — no modifica la firma de las funciones de 003. `Rng` vive en `packages/core/src/rng/` y no está re-exportado desde `duel/index.ts`.

**CE-005 (verificable por grep/diff):** ningún archivo bajo `packages/core/src/momentum/` debe contener una copia local de la lógica de `applyDiminishing` ni redefinir `DuelEvent`/`ShotEvent`/`DuelSegment`/`ShotSegment`. `resolveDuel.ts` y `resolveShot.ts` no aparecen en el diff de esta feature.

## Contrato de datos: `packages/content/src/momentum`

```ts
// packages/content/src/momentum/eventTable.ts
export const MomentumEventTableSchema: ZodType<Record<MomentumEventCause, number>>;
export const momentumEventTable: Record<MomentumEventCause, number>; // validado con .parse() al cargar

// packages/content/src/momentum/duelResultTable.ts
export const MomentumDuelTableSchema: ZodType<{
  crushingSuccess: number; won: number; splitBall: number; simpleLoss: number;
  disadvantagedLoss: number; devastatingCounter: number;
}>;
export const momentumDuelResultTable: z.infer<typeof MomentumDuelTableSchema>;
```

### Nota B — la 003 resuelve `rivalTrough`; 004 solo decide CUÁNDO llamar

Decisión revisada: delegar la resolución de `rivalTrough` a 004 habría sacado una regla de la tabla de umbrales de la §7 fuera del sistema de momentum, y habría dejado el escenario "mi rival cae a −5 y yo gano 'en la zona'" sin poder testearse de extremo a extremo dentro de la 003. Como `MomentumState` ya es, por diseño de la propia spec, "barra por equipo (2 valores)" (§Entidades clave), la 003 define `MatchMomentumState` (el par) y `detectThresholdCrossing` recibe el par completo — con eso tiene toda la información que necesita para resolver los tres caminos (±3/±4 mecánicos, `ownPeak`, `rivalTrough`) sin ningún dato que solo 004 posea.

Lo que SÍ sigue siendo de 004 (y solo eso): decidir en qué momento del ciclo de posesión invocar `detectThresholdCrossing` (p. ej. tras cada evento/duelo que mueva una barra) y con qué `movedSide`. 004 no resuelve ninguna regla de umbral; solo dispara la llamada. Esto es análogo a `degradeMomentum` (RF-011): 003 expone la operación pura, 004 decide cuándo ejecutarla por posesión.

**Criterio de aceptación:** `momentumEventTable` y `momentumDuelResultTable` DEBEN pasar `Schema.parse(data)` en un test de `packages/content` (constitución Principio 4: "todo save o contenido importado... debe validarse con Zod"; aquí se exige que el propio dato del catálogo se autovalide en test, no solo en runtime).

## Fuera de este contrato (explícitamente, según spec.md)

- Cómo la capa de partido (004) invoca `degradeMomentum` por posesión, compone `computeMomentumModifier` dentro de `DuelSide.modifiers`/`ShotSide.modifiers`, o decide CUÁNDO llamar a `detectThresholdCrossing` con qué `movedSide` — eso es contrato de 004, no de 003. La REGLA de qué efecto dispara cada cruce (incluido `rivalTrough`) sí es de 003 (ver Nota B).
- Consumo de `maxReached`/`playsAtPeakPositive` para bonus post-partido — feature futura.
- Implementación de cualquier `TraitHook` concreto.
- Integración visual de `ThresholdEffect` en UI.
