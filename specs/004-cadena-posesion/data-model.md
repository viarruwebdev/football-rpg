# Data Model: Cadena de posesión y reloj de partido (004)

Fuente: `spec.md` §Entidades clave + manual §2/§3 (skill `football-rules`) + `research.md`.

---

## MatchClock

```ts
type MatchPhase = 'firstHalf' | 'secondHalf' | 'stoppage';

interface MatchClock {
  /** Jugadas transcurridas en la parte actual. Nunca retrocede (CE-015). */
  playsElapsed: number;
  /** Fase actual. Solo avanza firstHalf -> secondHalf -> stoppage (CE-015). */
  phase: MatchPhase;
  /** Jugadas de cada parte reglamentaria. Fijo: 30 + 30 (manual §2). */
  halfLength: 30;
  /** Descuento exacto, derivado de eventos consumidores de tiempo sobre una
   *  base sembrada (RF-003). Existe desde el inicio del partido —
   *  el determinismo lo exige — pero su visibilidad es progresiva (ver
   *  stoppageTimeVisibility). Un solo descuento al final del partido, no uno
   *  por parte (verificado contra §2: "tres actos", spec.md Clarificaciones
   *  sesión 2026-07-10). */
  exactStoppageTime: number;
  /** Qué ve el jugador: rango estimado hasta que quedan 2 jugadas, momento en
   *  que se revela exactStoppageTime (RF-004). */
  stoppageTimeVisibility: { kind: 'range'; min: number; max: number } | { kind: 'exact'; value: number };
  /** Registro de eventos consumidores de tiempo (falta +0.5, lesión +1,
   *  cambio +0.5) que alimentan exactStoppageTime (RF-003). La 004 acepta
   *  estas contribuciones como entrada; no las genera (fuera de alcance:
   *  faltas/lesiones/sustituciones son features futuras). */
  stoppageContributions: TimeConsumingEvent[];
}

interface TimeConsumingEvent {
  kind: 'foul' | 'injury' | 'substitution';
}
```

**Reglas de validez:**
- `playsElapsed` nunca decrece dentro de la misma `phase`, y se reinicia a 0 al cruzar a la siguiente `phase` (jugadas de primera y segunda parte se cuentan por separado contra `halfLength`; el descuento no tiene tope fijo, termina cuando el partido termina).
- `phase` solo transiciona `firstHalf → secondHalf → stoppage`, nunca hacia atrás ni saltando (CE-015, invariante property-based).
- `exactStoppageTime = base + 0.5×faltas + 1×lesiones + 0.5×cambios`, base sembrada en [4, 8] (RF-003). Se calcula una sola vez al construir el `MatchClock` inicial (o incrementalmente conforme llegan `stoppageContributions`, pero el valor final es el mismo dado el mismo conjunto de eventos — determinismo, no remuestreo).
- `stoppageTimeVisibility` cambia de `range` a `exact` exactamente cuando quedan 2 jugadas del descuento, nunca antes (RF-004).

## PossessionState

```ts
type Strip = 'defense' | 'midfield' | 'attack' | 'area'; // perspectiva del ATACANTE (§7 nota de marco de referencia)
type Lane = 'left' | 'center' | 'right'; // reutiliza Lane de duel/types.ts

interface PossessionState {
  attackingSide: MomentumSide; // 'home' | 'away', reutilizado de momentum/types.ts
  strip: Strip;
  lane: Lane;
  /** Presión defensiva acumulada. +1 por eslabón consecutivo de esta
   *  posesión (RF-006); entra como mod situacional en resolveDuel, sujeto a
   *  applyDiminishing (no íntegro). Se resetea a 0 al abrir cada posesión
   *  nueva, incluida la iniciada por robo de balón (RF-011). */
  accumulatedPressure: number;
  /** Duelos ganados EN ESTA posesión. Mismo contador que
   *  MomentumState.consecutiveWins (spec.md Clarifications, sesión
   *  2026-07-09) — vive replicado aquí solo como espejo de lectura para que
   *  transition.ts no necesite importar MomentumState; la fuente de verdad
   *  sigue siendo MomentumState.consecutiveWins. */
  duelsWonInPossession: number;
  /** One-shot: si possessionStreak ya se emitió en esta posesión (RF-009).
   *  Se resetea a false al abrir cada posesión nueva. */
  possessionStreakEmitted: boolean;
  /** Banderas por equipo para la condición de degradación (RF-010): hubo
   *  evento significativo O duelo ganado. Se leen al cerrar la posesión y se
   *  reinician al abrir la siguiente. */
  hadSignificantEventOrWin: Record<MomentumSide, boolean>;
}
```

**Reglas de validez:**
- `accumulatedPressure` empieza en 0 en cada posesión nueva (inicio de partido, tras gol, tras robo, tras reloj a 0) y sube +1 por cada eslabón que resulte en `forcedAdvance` u otra transición que la tabla de §6 marque como generadora de presión — ver `transition.ts`, RF-020. El cuarto eslabón consecutivo aporta +3 acumulado (manual §3: "el cuarto eslabón tiene al defensor con +3 de bonus acumulado").
- `duelsWonInPossession` y `possessionStreakEmitted` se resetean juntos al cerrar cualquier posesión (CE-013), no solo al perder un duelo — es la ampliación de superficie sobre `MomentumState.consecutiveWins` que pide RF-009c (ver `research.md` #2, `resetConsecutiveWins`).
- `strip`/`lane` solo cambian por una `PossessionTransition` que lo indique (`cleanAdvance`, `crushingAdvance`, `forcedAdvance` avanzan `strip`; efectos de carril fuera de alcance de esta feature salvo el ya modelado en `resolveDuel`).

## PossessionTransition (discriminated union, RF-020)

Derivada de `DuelSegment` (`packages/core/src/duel/types.ts`, ya existente) mediante una tabla interna en `match/transition.ts`. Verificada tramo por tramo contra §6 (ver `spec.md` §Entidades clave y sesión de clarificación 2026-07-10). Los efectos secundarios de cada variante se **emiten como evento** pero no se ejecutan en v1 (RF-020) — son puntos de extensión, igual que `isPenalty?` en 002.

```ts
type PossessionTransition =
  | { kind: 'crushingAdvance' }     // DuelSegment.crushingSuccess (>=+6): avanza + stealCard + defenderBeaten
  | { kind: 'cleanAdvance' }        // DuelSegment.cleanSuccess (+3..+5): avanza
  | { kind: 'forcedAdvance' }       // DuelSegment.forcedAdvance (+1..+2): avanza + presión +1 extra + defenderRepositions
  | { kind: 'splitBall' }           // DuelSegment.splitBall (0): ni avanza ni pierde + miniDuel + 1 jugada extra de reloj
  | { kind: 'possessionLost' }      // DuelSegment.simpleLoss (-1..-2): cede el balón
  | { kind: 'disadvantageLoss'; transitionBonus: 2 }   // DuelSegment.disadvantagedLoss (-3..-5): cede + bonus rival
  | { kind: 'devastatingCounter'; zoneBoost: 3 };       // DuelSegment.devastatingCounter (<=-6): cede + salto de zona + attackerDisoriented

const DUEL_SEGMENT_TO_TRANSITION: Record<DuelSegment, PossessionTransition> = {
  crushingSuccess: { kind: 'crushingAdvance' },
  cleanSuccess: { kind: 'cleanAdvance' },
  forcedAdvance: { kind: 'forcedAdvance' },
  splitBall: { kind: 'splitBall' },
  simpleLoss: { kind: 'possessionLost' },
  disadvantagedLoss: { kind: 'disadvantageLoss', transitionBonus: 2 },
  devastatingCounter: { kind: 'devastatingCounter', zoneBoost: 3 },
};
```

**Regla de validez:** el mapeo es total y exhaustivo sobre los 7 valores de `DuelSegment` — ningún tramo queda sin `PossessionTransition` (mismo principio de cobertura exhaustiva que `DuelMomentumTable` en la 003).

## MatchState

```ts
interface MatchState {
  clock: MatchClock;
  possession: PossessionState;
  momentum: MatchMomentumState; // reutilizado de packages/core/src/momentum, sin modificar su forma
  score: Record<MomentumSide, number>;
  rng: Rng; // reutilizado de packages/core/src/rng/types.ts
  /** Punto de extensión sin lógica en v1 — mismo patrón que isPenalty? (002)
   *  y TraitHook (003). La 004 no ejecuta cambios de jugador ni ajustes
   *  tácticos de descanso. */
  halftimeActions?: HalftimeAction[];
}

/** Opaco en v1 — el catálogo de acciones de descanso es de otra feature. */
type HalftimeAction = unknown;
```

**Reglas de validez:**
- `score` solo se incrementa por eventos de gol emitidos por `resolveShot` (`ShotEvent` de tipo `goal`/`goalOnRebound`/`unstoppableGoal`), nunca directamente por el orquestador.
- `rng` nunca se comparte sin `.split()` entre dos duelos/remates consecutivos (RF-015, instrucción explícita del usuario) — ver §Flujo de datos.

## MatchEvent (log de partido, API pública)

```ts
type MatchEvent =
  | { type: 'duelResolved'; segment: DuelSegment; transition: PossessionTransition }
  | { type: 'shotResolved'; segment: ShotSegment }
  | { type: 'possessionStarted'; side: MomentumSide; reason: 'kickoff' | 'turnover' | 'restart' }
  | { type: 'possessionEnded'; side: MomentumSide; reason: 'goal' | 'turnover' | 'clockExpired' }
  | { type: 'goal'; side: MomentumSide }
  | { type: 'clockPhaseChanged'; phase: MatchPhase }
  | { type: 'stoppageTimeRevealed'; value: number }
  | { type: 'momentumThresholdEffect'; effect: ThresholdEffect } // reutilizado de momentum/types.ts
  | { type: 'lastGasp'; side: MomentumSide };                    // RF-013, "último suspiro"
```

**API pública del orquestador** (spec.md, Clarificaciones sesión 2026-07-10):

```ts
function playMatch(initial: MatchState): { state: MatchState; events: MatchEvent[] };
```

Sigue el patrón `reducir(estado, acción, rng) → { estado, eventos }` de la constitución §1. `rng` viaja dentro de `initial.state.rng`, no como parámetro separado, porque el partido completo consume progresivamente el mismo árbol de `Rng` a través de `.split()` — no hay una "acción" discreta externa en v1 (la entrada de cartas/jugador es un punto de extensión fuera de alcance; en v1 el orquestador genera dobles de prueba deterministas por semilla para cada duelo, ver `quickstart.md`).

## Relaciones y flujo de datos

```
playMatch(initial: MatchState)
  │
  ├─ por cada duelo:
  │     rngDuel = state.rng.split()          # RF-015: split() una vez por duelo, nunca reusado
  │     duelResult = resolveDuel(input, rngDuel)     # (001, SIN modificar)
  │     transition = DUEL_SEGMENT_TO_TRANSITION[duelResult.segment]   # transition.ts, RF-020
  │     momentum = applyDuelResult(momentum[attackingSide], duelResult.segment)  # (003, SIN modificar)
  │     possession = applyTransition(possession, transition)   # possession.ts: avanza strip/lane, presión +1
  │     si duelsWonInPossession alcanza 3 y !possessionStreakEmitted:
  │           momentum = applyEvent(momentum[attackingSide], 'possessionStreak')  # RF-009
  │     clock = advanceClock(clock, 'normalDuel')   # clock.ts, tabla §2
  │
  ├─ al llegar a strip==='area' y decidir rematar:
  │     rngShot = state.rng.split()
  │     shotResult = resolveShot(input, rngShot)    # (002, SIN modificar)
  │     cause = shotSegmentToMomentumCause(shotResult.segment)   # (003, reutilizado)
  │     si cause !== null: momentum = applyEvent(momentum[defendingSide], cause)
  │     clock = advanceClock(clock, 'shot')
  │
  ├─ al robar el balón (transition.kind implica pérdida):
  │     si possession.strip está en {'defense','midfield'} del atacante:
  │           momentum = applyEvent(momentum[stealingSide], 'pressingSteal')   # RF-009b
  │     possession = createPossession(stealingSide)   # presión -> 0, streak flag -> false
  │
  ├─ al cerrar cualquier posesión (gol, robo, reloj a 0):
  │     momentum[home] = resetConsecutiveWins(momentum[home])   # RF-009c, research.md #2
  │     momentum[away] = resetConsecutiveWins(momentum[away])
  │     para cada side: si !hadSignificantEventOrWin[side]:
  │           { match: momentum, effects, resets } = degradeAndDetect(momentum, side, context)  # (003, SIN modificar)
  │
  ├─ al construir el array de mods para resolveDuel:
  │     modifiers = buildSituationalModifiers(possession.accumulatedPressure,
  │                                            momentum[attackingSide].bar)   # momentumWiring.ts, research.md #3
  │     # buildSituationalModifiers internamente llama computeMomentumModifier(bar) (003, reutilizado)
  │     # applyDiminishing (001, reutilizado) se invoca DENTRO de resolveDuel — 004 no lo llama directamente
  │
  └─ al agotarse el reloj:
        si posesión en curso: se completa el duelo actual (RF-012)
        si atacante pierde y reloj a 0: 1 duelo extra, 'último suspiro' (RF-013), evento 'lastGasp'
        devuelve { state: MatchState, events: MatchEvent[] }
```

**Nota de reutilización (CE-009):** ninguna flecha del diagrama anterior reimplementa lógica de 001/002/003 — todas invocan la función existente por su nombre real. La única función nueva en código ya existente es `resetConsecutiveWins` (`momentum/state.ts`, ver `research.md` #2), que es una ampliación de superficie, no una modificación de `applyEvent`/`applyDuelResult`/`detectThresholdCrossing`/`applyThresholdEffects`.
