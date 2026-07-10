# Tasks: Cadena de posesión y reloj de partido (004)

**Branch**: `004-cadena-posesion`
**Input**: `specs/004-cadena-posesion/` — plan.md, spec.md, data-model.md, contracts/match-module.md, research.md
**Quality gate**: `pnpm type && pnpm check && pnpm test` en verde antes de cerrar cada fase.
**Verificación de determinismo**: `grep -rnE "Math\.random|Date\.now|new Date|fetch\(|window\.|document\." packages/core/src/match` debe estar vacío al final.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo con otras tareas de la misma fase
- **[Story]**: Historia de usuario de spec.md (US1–US4)
- Todas las rutas son relativas a la raíz del monorepo

---

## Phase 1: Setup — Estructura del módulo

**Purpose**: Crear los archivos vacíos con sus barrels antes de escribir lógica. Permite que el compilador valide imports desde el primer commit.

- [X] T001 Crear `packages/core/src/match/index.ts` vacío (barrel export) y `packages/core/src/match/types.ts` con los tipos del data-model.md: `MatchPhase`, `MatchClock`, `Strip`, `PossessionState`, `PossessionTransition` (discriminated union de 7 variantes verificadas contra §6), `MatchState`, `HalftimeAction`, `MatchEvent`, `TimeConsumingEvent`, `TimeConsumingAction` — sin lógica, solo tipos y el `DUEL_SEGMENT_TO_TRANSITION` como `const` tipada `Record<DuelSegment, PossessionTransition>`
- [X] T002 [P] Crear archivos vacíos con firma de función exportada (sin cuerpo): `packages/core/src/match/clock.ts`, `packages/core/src/match/possession.ts`, `packages/core/src/match/transition.ts`, `packages/core/src/match/momentumWiring.ts`, `packages/core/src/match/endgame.ts`, `packages/core/src/match/playMatch.ts`
- [X] T003 [P] Crear directorio `packages/core/src/match/__tests__/` con archivos vacíos: `clock.test.ts`, `clock.property.test.ts`, `possession.test.ts`, `transition.test.ts`, `momentumWiring.test.ts`, `endgame.test.ts`, `playMatch.golden.test.ts`
- [X] T004 Actualizar el barrel de `packages/core/src/index.ts` (o el barrel raíz de `packages/core`) para re-exportar desde `./match` — verificar con `pnpm type` que el grafo de imports compila sin errores

**Checkpoint**: `pnpm type` en verde. Ningún archivo existente de `packages/core/src/duel/`, `shot/` o `momentum/` debe haber cambiado.

---

## Phase 2: Foundational — RF-009c (ampliación de momentum, código mergeado)

**Purpose**: La única modificación a código ya mergeado de la 003. Debe hacerse antes que cualquier tarea de posesión u orquestación, porque `closePossession` (fase 4) la importa. Si nadie le pone tarea explícita se hace "de paso" y los tests de la 003 pueden romperse sin que nadie lo note.

⚠️ **CRÍTICO**: Esta fase toca `packages/core/src/momentum/`, código cerrado por la 003. La verificación de no-regresión de la 003 es obligatoria antes de pasar a la fase 3.

- [X] T005 Añadir `resetConsecutiveWins(state: MomentumState): MomentumState` en `packages/core/src/momentum/state.ts` — función pura que devuelve `{ ...state, consecutiveWins: 0 }` (o la forma equivalente según cómo `MomentumState` almacene el contador; ver `packages/core/src/momentum/state.ts` para la forma exacta antes de escribir). No modificar ninguna función existente del archivo.
- [X] T006 Exportar `resetConsecutiveWins` desde `packages/core/src/momentum/index.ts` junto al resto de la superficie existente — un solo line de export, sin reordenar ni tocar el resto del barrel.
- [X] T007 Añadir test unitario para `resetConsecutiveWins` en `packages/core/src/momentum/__tests__/state.test.ts` (o el archivo de tests correspondiente de la 003): caso "consecutiveWins > 0 → devuelve 0", caso "consecutiveWins ya es 0 → no muta el resto del estado". El test debe ponerse **rojo** contra el código pre-T005 antes de considerarlo bueno (CE de no-regresión: un test que nunca ha fallado contra el bug no cubre nada).
- [X] T008 Ejecutar `pnpm test packages/core/src/momentum` y verificar que **todos** los tests de la 003 pasan sin cambios. Si alguno falla, corregir antes de avanzar. Documentar resultado en un comentario de commit.

**Checkpoint**: `pnpm type && pnpm check && pnpm test` en verde. `git diff main...004-cadena-posesion -- packages/core/src/momentum/` muestra únicamente las dos modificaciones: `state.ts` (función nueva) e `index.ts` (export). Ningún otro archivo de `momentum/` aparece en el diff.

---

## Phase 3: User Story 3 — Reloj compartido (P1, sin dependencias)

**Goal**: El reloj de jugadas funciona de forma autónoma: consume jugadas por evento, avanza de fase, calcula el descuento, y cumple el invariante de monotonicidad (CE-015). Es la única pieza sin dependencias de posesión ni momentum.

**Historias cubiertas**: Historia 3 (P1) — "El reloj es un recurso compartido"
**Criterios de aceptación independientes**: `pnpm test packages/core/src/match/__tests__/clock.test.ts` y `clock.property.test.ts` en verde con `playMatch` aún no implementado.

### Implementación

- [X] T009 [US3] Implementar en `packages/core/src/match/clock.ts`:
  - Constante `CLOCK_CONSUMPTION: Record<TimeConsumingAction, number>` con las 10 filas exactas de RF-002 (tabla del §2 verificada en spec.md): `normalDuel` 1, `splitBall` +1, `foulPlusFreeKick` 1, `corner` 2, `penalty` 2, `substitution` 1, `laneChange` 1, `safePass` 1, `sterilePossession` 2, `shot` 1. **Nombres en inglés de dominio**: `foul` es la falta deportiva (no `fault`, que es falla/defecto); `sterilePossession` (sin doble `i`).
  - **A1 — entradas sin emisor en v1 (puntos de extensión, no código muerto):** `corner`, `penalty` y `sterilePossession` son claves válidas de `CLOCK_CONSUMPTION` que **ningún** camino de v1 dispara (córner/penalti/posesión estéril están fuera de alcance, RF-019). Se declaran igualmente porque la tabla del §2 es total y el reloj debe aceptarlas como entrada cuando lleguen sus features. No las elimines por parecer inalcanzables.
  - `advanceClock(clock: MatchClock, action: TimeConsumingAction): MatchClock` — incrementa `playsElapsed`, avanza `phase` cuando `playsElapsed >= halfLength` (firstHalf→secondHalf) o cuando entra en stoppage, nunca retrocede.
  - `computeStoppageTime(base: number, contributions: TimeConsumingEvent[]): number` — `base + 0.5 * fouls + 1 * injuries + 0.5 * substitutions` (RF-003).
  - Lógica de visibilidad: `stoppageTimeVisibility` cambia de `range` a `exact` exactamente cuando quedan 2 jugadas de descuento (RF-004).

- [X] T010 [US3] Escribir tests unitarios en `packages/core/src/match/__tests__/clock.test.ts`:
  - CE-002: 30 jugadas de primera parte → transición `firstHalf→secondHalf`, 30 más → `secondHalf→stoppage`.
  - CE-003: mismo conjunto de `TimeConsumingEvent` + misma base → mismo `exactStoppageTime` en dos llamadas.
  - RF-004: `stoppageTimeVisibility` es `range` a 3 jugadas restantes del descuento, `exact` a 2.
  - RF-002: `advanceClock(clock, 'splitBall')` avanza 2 jugadas en total (el "+1 extra lo cobra el reloj", spec §RF-002).
  - Tabla de 10 filas: un test parametrizado que recorre todas las acciones y verifica su consumo exacto.
  - **C1 — descuento derivado de contribuciones (RF-003):** un `MatchClock` construido con N faltas, M lesiones y K cambios como entrada → `exactStoppageTime == base + 0.5·N + 1·M + 0.5·K`. Caso concreto: base 4, 2 faltas, 1 lesión, 1 cambio → `4 + 1.0 + 1.0 + 0.5 == 6.5`.
  - **C1 — doble efecto de la falta (RF-002 + RF-003 simultáneos):** una única falta debe (a) consumir +1 jugada de reloj *en el momento* vía `advanceClock(clock, 'foulPlusFreeKick')` **y** (b) sumar +0.5 al `exactStoppageTime` vía su contribución. El test verifica ambos efectos sobre la misma falta, no uno u otro. (Ver spec §RF-002 "Falta — doble efecto".)

- [X] T011 [US3] Escribir tests property-based en `packages/core/src/match/__tests__/clock.property.test.ts` (fast-check):
  - CE-015: para toda secuencia arbitraria de `TimeConsumingAction`, `playsElapsed` nunca decrece dentro de una fase y `phase` solo avanza en el orden `firstHalf → secondHalf → stoppage`.
  - Invariante: `exactStoppageTime >= 4` para base mínima sin contributions.

**Checkpoint**: `pnpm test packages/core/src/match/__tests__/clock` en verde. `playMatch.ts` aún puede estar vacío.

---

## Phase 4: User Story 1 — Cadena de posesión (P1, depende de Phase 3)

**Goal**: Una posesión completa avanza por franjas con presión acumulada, traduce `DuelSegment` a `PossessionTransition`, y cierra limpiamente al perder. Depende del reloj (Phase 3) para `advanceClock`; no depende aún del orquestador.

**Historias cubiertas**: Historia 1 (P1) — "Una posesión avanza por la cadena hasta rematar o perderse"
**Criterios de aceptación independientes**: `pnpm test packages/core/src/match/__tests__/transition.test.ts` y `possession.test.ts` en verde.

### Implementación

- [X] T012 [P] [US1] Implementar `packages/core/src/match/transition.ts`:
  - `segmentToTransition(segment: DuelSegment): PossessionTransition` — lookup total sobre `DUEL_SEGMENT_TO_TRANSITION` (ya definido en `types.ts`, T001). `Record<DuelSegment, PossessionTransition>` garantiza exhaustividad en compile-time; no hay `default` ni `throw`.
  - La función es una línea: `return DUEL_SEGMENT_TO_TRANSITION[segment]`.

- [X] T013 [P] [US1] Implementar `packages/core/src/match/possession.ts`:
  - `createPossession(attackingSide: MomentumSide, strip?: Strip, lane?: Lane): PossessionState` — `accumulatedPressure: 0`, `duelsWonInPossession: 0`, `possessionStreakEmitted: false`, `hadSignificantEventOrWin: { home: false, away: false }`.
  - `applyTransition(possession: PossessionState, transition: PossessionTransition): PossessionState` — según la variante: los tres avances (`crushingAdvance`, `cleanAdvance`, `forcedAdvance`) incrementan `strip` hacia `area`; `forcedAdvance` además suma +1 a `accumulatedPressure`; `crushingAdvance` también suma +1 (marca avance más limpio pero sigue siendo presión); los cuatro resultados de pérdida/neutro no avanzan strip. Emite los eventos secundarios como datos en el retorno pero no los ejecuta (ver RF-020: `stealCard`, `defenderBeaten`, `miniDuel`, `zoneBoost`, `transitionBonus` son puntos de extensión).
  - `closePossession(state: MatchState, reason: 'goal' | 'turnover' | 'clockExpired'): { state: MatchState; events: MatchEvent[] }` — llama a `resetConsecutiveWins` (importado de `../momentum`) para **ambos** equipos (RF-009c), luego `degradeAndDetect` para ambos con la condición de §7 (RF-010), emite `possessionEnded`.

- [X] T014 [US1] Escribir tests unitarios en `packages/core/src/match/__tests__/transition.test.ts`:
  - RF-020: los 7 valores de `DuelSegment` producen el `PossessionTransition.kind` correcto.
  - CE-014 (pressingSteal no invertido — dos casos simétricos obligatorios): `strip: 'defense'` del atacante → produce `possessionLost` (la condición de `pressingSteal` la evalúa el orquestador, no `transition.ts`, pero el test documenta el marco de referencia). Nota: el test de si `pressingSteal` se emite correctamente va en `momentumWiring.test.ts` (T020).
  - `disadvantageLoss` lleva `transitionBonus: 2`; `devastatingCounter` lleva `zoneBoost: 3`.

- [X] T015 [US1] Escribir tests unitarios en `packages/core/src/match/__tests__/possession.test.ts`:
  - Historia 1 aceptación: 4 eslabones de `forcedAdvance` → `accumulatedPressure === 3` al cuarto (manual §3: "el cuarto eslabón tiene al defensor con +3 de bonus acumulado").
  - **G1 — CE-004 como fórmula, no solo caso puntual (property-based, fast-check):** para toda cadena de `n` eslabones que suman presión (con `n` arbitrario), tras aplicar las `n` transiciones la `accumulatedPressure` es exactamente `n − 1` (el eslabón *n* aporta +(n−1) al defensor). Barato y cubre la fórmula general, no solo `n=4`.
  - CE-013: `closePossession` con reason `'goal'` → `consecutiveWins === 0` en el `MomentumState` resultante (verifica RF-009c).
  - `createPossession` → `possessionStreakEmitted === false`, presión 0.
  - `applyTransition` con `crushingAdvance` → strip avanza; con `splitBall` → strip no cambia, presión no cambia.

**Checkpoint**: `pnpm test packages/core/src/match/__tests__/transition packages/core/src/match/__tests__/possession` en verde.

---

## Phase 5: User Story 2 — Cableado de momentum (P1, depende de Phase 2 y 4)

**Goal**: `computeMomentumModifier` entra en el array de mods de `resolveDuel`. CE-005: con momentum +5, el bruto incluye +0.75. Depende de `resetConsecutiveWins` (Phase 2) y de `closePossession` (Phase 4) para el wiring de degradación.

**Historias cubiertas**: Historia 2 (P1) — "El momentum afecta por fin a los duelos"
**Criterios de aceptación independientes**: `pnpm test packages/core/src/match/__tests__/momentumWiring.test.ts` en verde.

### Implementación

- [X] T016 [US2] Implementar `packages/core/src/match/momentumWiring.ts`:
  - `buildSituationalModifiers(pressure: number, momentumBar: number, extraModifiers: number[] = []): number[]` — devuelve `[pressure, computeMomentumModifier(momentumBar), ...extraModifiers]`. **No llama a `applyDiminishing`** (contracts §Nota B; lo llama `resolveDuel` internamente).
  - `emitPossessionStreak(possession: PossessionState, momentum: MatchMomentumState, attackingSide: MomentumSide): { possession: PossessionState; momentum: MatchMomentumState; events: MatchEvent[] }` — emite `possessionStreak` una sola vez cuando `duelsWonInPossession >= 3 && !possessionStreakEmitted` (RF-009), actualiza el flag, llama a `applyEvent`.
  - `emitPressingSteal(strip: Strip, stealingSide: MomentumSide, momentum: MatchMomentumState): { momentum: MatchMomentumState; events: MatchEvent[] }` — emite `pressingSteal` si `strip === 'defense' || strip === 'midfield'` (perspectiva del atacante que pierde el balón, RF-009b). **No emite** si `strip === 'attack' || strip === 'area'`.

- [X] T017 [US2] Escribir tests unitarios en `packages/core/src/match/__tests__/momentumWiring.test.ts`:
  - CE-005: `buildSituationalModifiers(0, 5)` devuelve array que contiene `0.75`; `buildSituationalModifiers(2, 5)` devuelve `[2, 0.75]`.
  - CE-005 (verificación grep inline): `applyDiminishing` no aparece como import en `momentumWiring.ts` — documentar el grep en comentario del test.
  - CE-012 (racha one-shot): `emitPossessionStreak` con `duelsWonInPossession: 3, possessionStreakEmitted: false` → emite evento; segunda llamada con `possessionStreakEmitted: true` → no emite.
  - CE-014 (pressingSteal no invertido): `emitPressingSteal('defense', ...)` → emite; `emitPressingSteal('area', ...)` → no emite; `emitPressingSteal('midfield', ...)` → emite; `emitPressingSteal('attack', ...)` → no emite. (Los cuatro valores de `Strip` cubiertos — ver CHK012 del checklist.)

**Checkpoint**: `pnpm test packages/core/src/match/__tests__/momentumWiring` en verde.

---

## Phase 6: Fin de partido — endgame (P1, depende de Phase 3)

**Goal**: RF-012 y RF-013 implementados y testeados de forma aislada, antes de integrarlos en el orquestador. Solo depende del reloj (Phase 3).

**Historias cubiertas**: Casos límite de spec.md §Casos límite
**Criterios de aceptación independientes**: `pnpm test packages/core/src/match/__tests__/endgame.test.ts` en verde.

### Implementación

- [X] T018 [US1] Implementar `packages/core/src/match/endgame.ts`:
  - `handleClockExpiry(state: MatchState): { state: MatchState; events: MatchEvent[] }` — si la posesión está en curso, permite completar el duelo actual (RF-012); si el atacante va perdiendo y quedan 0 jugadas, concede exactamente 1 duelo extra con evento `lastGasp` (RF-013, "último suspiro"); nunca concede un segundo duelo extra.

- [X] T019 [US1] Escribir tests unitarios en `packages/core/src/match/__tests__/endgame.test.ts`:
  - RF-012: reloj a 0 durante duelo en curso → el duelo se completa antes de terminar.
  - RF-013: atacante pierde por 1-0, reloj a 0 → exactamente 1 duelo extra (evento `lastGasp`); el segundo turno no se concede.
  - RF-013 inverso: atacante empata o gana, reloj a 0 → no hay `lastGasp`.

**Checkpoint**: `pnpm test packages/core/src/match/__tests__/endgame` en verde.

---

## Phase 7: User Story 4 — Inversión de roles limpia (P2, depende de Phases 3–6)

**Goal**: Historia 4 (P2) — el robo invierte roles, resetea presión, emite `pressingSteal` si procede, y el reloj sigue corriendo. Esta historia se implementa dentro del orquestador (`playMatch.ts`), que requiere todas las piezas anteriores.

**Historias cubiertas**: Historia 4 (P2) — "El robo invierte los roles limpiamente"
**Criterios de aceptación**: `pnpm test packages/core/src/match/__tests__/possession.test.ts` (casos de inversión) en verde.

### Implementación

- [X] T020 [US4] Implementar el ciclo de robo en `packages/core/src/match/playMatch.ts` (parcial — solo la lógica de inversión de roles, no el bucle completo de partido que va en Phase 8):
  - Al detectar una transición de pérdida (`possessionLost`, `disadvantageLoss`, `devastatingCounter`): llama a `emitPressingSteal` si `possession.strip` es `'defense'` o `'midfield'` del atacante (RF-009b).
  - Cierra la posesión con `closePossession(state, 'turnover')`.
  - Abre nueva posesión con `createPossession(stealingSide)` — presión a 0, flags reseteados.
  - El reloj **no se pausa** (RF-011).

- [X] T021 [US4] Añadir casos de robo a `packages/core/src/match/__tests__/possession.test.ts`:
  - Robo en `strip: 'defense'` → se llama `emitPressingSteal` (spy/mock sobre `momentumWiring`).
  - Robo en `strip: 'area'` → no se llama `emitPressingSteal`.
  - Tras el robo: `newPossession.accumulatedPressure === 0`, `newPossession.attackingSide !== oldPossession.attackingSide`.

**Checkpoint**: `pnpm test packages/core/src/match/__tests__/possession` en verde con todos los casos de inversión.

---

## Phase 8: Orquestador — `playMatch` completo (depende de Phases 3–7)

**Goal**: Integrar todas las piezas en el bucle de partido completo. Devuelve `{ state: MatchState, events: MatchEvent[] }`. Habilita CE-001 (golden replay) y CE-008 (banda de goles).

**Historias cubiertas**: Todas (integración final)
**Criterios de aceptación**: `pnpm test packages/core/src/match/__tests__/playMatch.golden.test.ts` en verde.

### Implementación

- [X] T022 Implementar el bucle principal en `packages/core/src/match/playMatch.ts`:
  - Inicialización: primera posesión del local (RF-014), clock en `firstHalf`, `playsElapsed: 0`.
  - **D1 — patrón EXACTO de avance del Rng (RF-015, el bug de la 001 al nivel de partido):** cada consumo del Rng divide y **reasigna el padre**:
    ```ts
    const [rngDuel, rngNext] = state.rng.split();
    state.rng = rngNext;   // el padre AVANZA — sin esto, todos los duelos derivan del mismo Rng inmutable
    const duelResult = resolveDuel(input, rngDuel);
    ```
    Sin la reasignación de `state.rng`, los 64 duelos del partido salen **idénticos**: determinista, reproducible y roto — y peor que el bug de la 001 porque un partido de duelos clonados parece funcionar. Aplica igual al remate (`rngShot`/`rngNext`). Nunca `rng.next()` directo sobre `state.rng`. (Nota: `resolveDuel` hace además su propio `.split()` interno para el muestreo triangular; eso es correcto y no cuenta como "consumo del Rng de partido".)
  - Por cada duelo: dividir y avanzar el Rng como arriba; `resolveDuel(input, rngDuel)`; `segmentToTransition`; `applyDuelResult` para momentum; `applyTransition` para posesión; `emitPossessionStreak` si aplica; `advanceClock(clock, 'normalDuel')`.
  - **N2 — mapeo del coste del balón dividido (contrato tácito, hazlo explícito):** cuando la transición sea `splitBall`, el bucle DEBE llamar además a `advanceClock(clock, 'splitBall')` para cobrar la jugada extra (total 2 por ese eslabón). La `PossessionTransition` es de dominio y NO lleva el coste (no mezclar capas: el coste es del reloj). La conexión "`splitBall` → 2 jugadas" es un contrato tácito entre `transition.ts` y `clock.ts`; se garantiza con el test T024/N2, no dejándolo a la memoria del implementador.
  - Al llegar a `strip === 'area'`: dividir y avanzar el Rng (`rngShot`/`rngNext`); `resolveShot(input, rngShot)`; momentum via `applyEvent`; `advanceClock(clock, 'shot')`.
  - Al cerrar posesión (gol, robo, reloj): `closePossession` (que ya incluye `resetConsecutiveWins` y `degradeAndDetect`).
  - Al cambiar de parte: emite `clockPhaseChanged`; la segunda parte la inicia el visitante (RF-014).
  - Al agotarse el reloj: delega en `handleClockExpiry`.
  - Devuelve `{ state: MatchState, events: MatchEvent[] }`.

- [X] T023 Actualizar `packages/core/src/match/index.ts` con todos los exports públicos del contrato (`contracts/match-module.md`): `playMatch`, `advanceClock`, `computeStoppageTime`, `createPossession`, `closePossession`, `applyTransition`, `segmentToTransition`, `buildSituationalModifiers`, `handleClockExpiry`, y los tipos `MatchState`, `MatchClock`, `MatchPhase`, `PossessionState`, `PossessionTransition`, `MatchEvent`.

- [X] T024 Escribir golden replay y tests de integración en `packages/core/src/match/__tests__/playMatch.golden.test.ts`:
  - CE-001: `playMatch(createInitialMatchState({ seed: 42 }))` ejecutado dos veces produce `events` idénticos y `state.score` idéntico. ⚠️ Recordar: verificar que el comportamiento capturado es el que la spec exige antes de congelar el snapshot (AGENTS.md §10: un golden sobre un bug convierte el bug en el contrato).
  - Anotar en el test el marcador esperado y los eventos clave del partido sembrado como comentario, para que cualquier cambio de balance se detecte visualmente en el diff del snapshot.
  - **D1 — test que caza el Rng no-avanzado (property-based):** en un partido de N duelos con la **misma configuración de entrada**, los resultados NO deben ser todos idénticos (`new Set(results).size > 1`). Aplicar el criterio de la 003: **verificar que este test se pone rojo contra la versión sin `state.rng = rngNext`** antes de darlo por bueno. Si el test pasa contra el código roto, no cubre nada.
  - **N2 — coste del balón dividido (contrato tácito entre transición y reloj):** una posesión que produzca un eslabón `splitBall` debe consumir exactamente **2 jugadas** para ese eslabón (1 del duelo + 1 del mini-duelo pendiente). Escribir el test que cuenta las jugadas consumidas, no solo documentar la conexión — los contratos tácitos se rompen en silencio (lección de la 003).

**Checkpoint**: `pnpm type && pnpm check && pnpm test` en verde. Verificar con grep **limitados a `match/`** (para no contar los `.split()`/`next()` internos de `resolveDuel`/`sampleTriangular`, que son correctos):
```bash
grep -rnE "Math\.random|Date\.now|new Date|fetch\(|window\." packages/core/src/match && echo "❌" || echo "✅"
grep -rn "function resolveDuel\|function resolveShot\|function applyDiminishing" packages/core/src/match && echo "❌" || echo "✅"
# D1: split() debe aparecer SOLO en playMatch.ts (los dos consumos: duelo y remate), nunca un next() directo sobre state.rng
grep -rn "state\.rng\.next\|\.rng\.next(" packages/core/src/match && echo "❌ next() directo sobre el Rng de partido" || echo "✅ sin next() directo"
grep -n "\.split()" packages/core/src/match/playMatch.ts   # inspección manual: exactamente los puntos de duelo y remate, cada uno con reasignación de state.rng
git diff main...004-cadena-posesion -- packages/core/src/duel/resolveDuel.ts packages/core/src/shot/resolveShot.ts
```

---

## Phase 9: Polish — harness y cierre

**Purpose**: CE-006/CE-007/CE-008. Verificación end-to-end contra las bandas de calibración.

- [X] T025 Extender `tools/sim` para que pueda ejecutar partidos completos vía `playMatch` (no solo duelos aislados): añadir un modo `--match` que corra N partidos IA-vs-IA y reporte goles/partido, jerarquía élite/mediocre. Reutilizar la infraestructura existente del harness; no reimplementar el bucle de partido (importa `playMatch` directamente).
- [X] T026 [P] Ejecutar `pnpm sim` con el matchup equilibrado de referencia (análogo a F15/R12 de la 002) y verificar CE-008: banda [2.0, 4.5] goles/partido. Resultado: 2.82 goles/partido ✓. Remates/partido: 4.8. Posesiones/partido: 26.9. Primera medición real con momentum cableado.
- [X] T027 [P] Ejecutar `pnpm sim` con matchup élite-vs-mediocre y verificar CE-006/CE-007: la jerarquía se preserva (equipo medio con momentum +5 pierde contra élite con −5) y las bandas de calibración de 001/002 no se mueven. Resultado: élite 100% win rate incluso con momentum -5 vs +5. Jerarquía preservada. Banda de goles para matchup extremo (attr 18 vs 9) calibrada en [5.0, 11.0] tras primera sim completa (F18/R9 → ~85% conversión × ~9 remates = 7-9 goles/partido, consistente con ADR-0002).
- [X] T028 Marcar el feature branch como listo: `pnpm type && pnpm check && pnpm test && pnpm sim` todos en verde. PR pendiente de abrir.

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
    └── Phase 2 (RF-009c / momentum)
            └── Phase 3 (Reloj) ──────────────────── Phase 6 (Endgame)
                    └── Phase 4 (Posesión)
                            └── Phase 5 (Momentum wiring)
                                    └── Phase 7 (Inversión de roles)
                                            └── Phase 8 (Orquestador)
                                                        └── Phase 9 (Harness)
```

**Fases independientes una vez desbloqueadas:**
- Phase 3 y Phase 2 pueden solaparse (el reloj no usa `momentum/`).
- Phase 6 puede ejecutarse en paralelo con Phase 4 y 5 (solo depende de Phase 3).
- T025/T026/T027 de Phase 9 son paralelas entre sí.

### Regla de prioridad interna

Dentro de cada fase: tipos → función pura → tests. Los tests deben ponerse rojos contra el código anterior a la tarea antes de considerarlos buenos (AGENTS.md §10).

---

## Parallel Execution Example: Phase 3 + Phase 6

```bash
# Pueden ejecutarse en paralelo una vez completada Phase 2:
Task T009: implementar clock.ts
Task T018: implementar endgame.ts  # solo depende del reloj, no de la posesión
```

## Parallel Execution Example: Phase 9

```bash
Task T026: pnpm sim matchup equilibrado (CE-008)
Task T027: pnpm sim matchup élite-mediocre (CE-006/CE-007)
```

---

## Implementation Strategy

### MVP (Historias P1 — Phases 1–8 sin harness)

1. Phase 1: estructura
2. Phase 2: RF-009c (ampliar momentum — bloqueante)
3. Phase 3: reloj (sin dependencias)
4. Phase 4: posesión (depende de reloj)
5. Phase 5: cableado momentum (depende de posesión + RF-009c)
6. Phase 6: endgame (puede ir en paralelo con 4 y 5)
7. Phase 7: inversión de roles
8. Phase 8: orquestador
9. **STOP**: `pnpm type && pnpm check && pnpm test` en verde → PR listo para revisión

### Entrega completa

10. Phase 9: harness + CE-008 + ADR-0003 si procede → feature cerrada

---

## Notes

- **RF-009c es Phase 2, no Phase 9.** Es fácil dejarlo para el final y romper tests de la 003 sin darse cuenta.
- **El reloj va antes que la posesión.** `closePossession` llama a `advanceClock`; sin reloj implementado, los tests de posesión no pueden correr de forma aislada.
- **Golden replay: verificar antes de congelar.** Un snapshot sobre un bug convierte el bug en el contrato (AGENTS.md §10). Leer el diff antes de hacer commit del snapshot.
- **`applyDiminishing` no aparece en `match/`.** Verificable con grep. Si aparece, es una reimplementación prohibida (CE-009/CE-010).
- **`Rng.split()` con reasignación del padre, una vez por duelo (D1).** El patrón obligatorio es `const [rngDuel, rngNext] = state.rng.split(); state.rng = rngNext;` — la reasignación es lo que evita que los 64 duelos salgan idénticos. El grep de verificación se limita a `playMatch.ts` (no a todo `match/`, ni al resto de `packages/core`), porque `resolveDuel`/`sampleTriangular` hacen su propio `.split()` interno legítimo que no debe contarse. El test T024/D1 debe ponerse **rojo** contra la versión sin reasignación.
- **El coste del balón dividido no vive en `PossessionTransition` (N2).** La transición es de dominio; el coste (2 jugadas) es del reloj. La conexión `splitBall → advanceClock('splitBall')` es un contrato tácito garantizado por el test T024/N2, no por la memoria del implementador.
