# Tasks: Sistema de momentum (003)

**Branch:** `003-sistema-momentum`
**Input:** Design documents from `/specs/003-sistema-momentum/`
**Spec:** spec.md (4 historias de usuario: US1/US2 P1, US3 P2, US4 P1)

**Metodología:** TDD Red→Green→Refactor. Los tests de cada historia se escriben PRIMERO y deben FALLAR antes de implementar. La implementación es solo lo que hace pasar los tests — nada más.

**Organización:** una fase de setup, una fundacional (tipos y tablas, bloqueante), una fase por historia (P1 primero, P2 después), y una de pulido.

---

## Phase 1: Setup (estructura del módulo)

**Purpose:** Crear la estructura de carpetas y archivos vacíos (o con stubs mínimos) para que TypeScript pueda compilar. Sin lógica todavía.

- [X] T001 Crear estructura de carpetas `packages/core/src/momentum/__tests__/` y `packages/content/src/momentum/__tests__/`
- [X] T001b Crear `packages/content/package.json` con `{"name":"@football-rpg/content","version":"0.0.1","main":"./src/index.ts","types":"./src/index.ts","private":true}` — prerequisito para que los imports `@football-rpg/content` resuelvan en el workspace pnpm. Ejecutar `pnpm install` tras crearlo para registrarlo en el workspace.
- [X] T002 Crear `packages/content/src/momentum/eventTable.ts` con schema Zod vacío y objeto de dato vacío (stub tipado)
- [X] T003 Crear `packages/content/src/momentum/duelResultTable.ts` con schema Zod vacío y objeto de dato vacío (stub tipado)
- [X] T004 Crear `packages/content/src/momentum/index.ts` que reexporte `eventTable` y `duelResultTable`
- [X] T005 Actualizar `packages/content/src/index.ts` para reexportar desde `./momentum` (primer contenido real del paquete; si el archivo no existe crearlo)
- [X] T006 [P] Crear `packages/core/src/momentum/types.ts` con las interfaces vacías: `MomentumState`, `MatchMomentumState`, `MomentumSide`, `PlayerInTheZone`, `MomentumThreshold`, `MomentumEventCause`, `ThresholdEffect`, `TraitHook`, `TraitHookContext`, `DegradationContext`
- [X] T007 [P] Crear stubs de módulos de lógica (funciones que lanzan `Error('not implemented')`): `packages/core/src/momentum/state.ts`, `packages/core/src/momentum/events.ts`, `packages/core/src/momentum/duelResult.ts`, `packages/core/src/momentum/modifier.ts`, `packages/core/src/momentum/thresholds.ts`, `packages/core/src/momentum/degradation.ts`, `packages/core/src/momentum/updateMomentum.ts`
- [X] T008 Crear `packages/core/src/momentum/index.ts` que reexporte las funciones públicas del contrato (`createMomentumState`, `createMatchMomentumState`, `applyEvent`, `applyDuelResult`, `computeMomentumModifier`, `detectThresholdCrossing`, `applyThresholdEffects`, `updateMomentum`, `degradeMomentum`) y los tipos correspondientes
- [X] T009 Verificar que `pnpm type` no reporta errores de tipos tras el setup (los stubs son válidos TypeScript aunque lancen error en runtime)

**Checkpoint:** la estructura existe y TypeScript compila sin errores de importación.

---

## Phase 2: Foundational — Tipos completos y tablas de datos (bloqueante)

**Purpose:** Definir los tipos e implementar los datos Zod. Sin estos, ninguna historia puede pasar sus tests.

⚠️ **CRÍTICO:** ninguna historia puede empezar hasta que esta fase esté completa.

### Tipos (`packages/core/src/momentum/types.ts`)

- [X] T010 Implementar el tipo completo `MomentumState` con todos sus campos: `bar`, `consecutiveWins`, `maxReached`, `playsAtPeakPositive`, `crossedThresholds: Set<MomentumThreshold>`, `playerInTheZone: PlayerInTheZone | null` — siguiendo exactamente `data-model.md`
- [X] T011 Implementar `MatchMomentumState = { home: MomentumState; away: MomentumState }` y `MomentumSide = 'home' | 'away'`
- [X] T012 [P] Implementar `MomentumEventCause` como unión de 8 literales de string (exactamente los de `data-model.md`, cobertura exacta de las 9 filas de "eventos significativos" del manual vía `goal` cubriendo marcar/encajar por `side`): `goal`, `tideTurningGoal`, `specialTechniqueSuccess`, `epicSave`, `oneOnOneSave`, `pressingSteal`, `possessionStreak`, `greatSave`. Reutiliza los nombres de `ShotMomentumCause` donde ya existen (`goal`, `greatSave`) — no hay tabla de traducción.
- [X] T013 [P] Implementar `MomentumThreshold = 3 | 4 | 5 | -3 | -4 | -5`
- [X] T014 [P] Implementar `PlayerInTheZone` con `playerId: string` y `triggeredBy: 'ownPeak' | 'rivalTrough'`
- [X] T015 [P] Implementar `ThresholdEffect` como discriminated union de 4 variantes: `cardPowerBonus`, `extraCardDraw`, `enteredTheZone`, `perfectPlayUnlocked` — siguiendo exactamente `data-model.md`
- [X] T016 [P] Implementar `TraitHook`, `TraitHookContext` y `DegradationContext` según `data-model.md`

### Tablas de datos (`packages/content/src/momentum/`)

- [X] T017 Implementar `MomentumEventTableSchema` en `packages/content/src/momentum/eventTable.ts`: `z.record(z.enum([...8 causas...]), z.number())` con los 8 literales exactos de `MomentumEventCause`
- [X] T018 Implementar el dato `momentumEventTable` con los deltas exactos de la §7 (9 filas, 8 claves): `goal:2`, `tideTurningGoal:3`, `specialTechniqueSuccess:1`, `epicSave:1`, `oneOnOneSave:1`, `pressingSteal:1`, `possessionStreak:1`, `greatSave:1` — y validarlo con `.parse()`. `goal:2` es el delta base para "marcar"; "encajar" (−2) lo deriva 004 invirtiendo el signo según `side`.
- [X] T019 Implementar `MomentumDuelTableSchema` en `packages/content/src/momentum/duelResultTable.ts`: `z.object({crushingSuccess:z.number(), cleanSuccess:z.number(), forcedAdvance:z.number(), splitBall:z.number(), simpleLoss:z.number(), disadvantagedLoss:z.number(), devastatingCounter:z.number()})` — 7 tramos exhaustivos, uno por cada literal de `DuelSegment`
- [X] T020 Implementar el dato `momentumDuelResultTable` con los deltas exactos de la §7 (7 tramos): `crushingSuccess:1`, `cleanSuccess:0.5`, `forcedAdvance:0`, `splitBall:0`, `simpleLoss:-1`, `disadvantagedLoss:-1.5`, `devastatingCounter:-2` — y validarlo con `.parse()`

### Tests de los datos (CE-009 prerequisito, tabla contenido)

- [X] T021 [P] Escribir `packages/content/src/momentum/__tests__/eventTable.test.ts`: (a) el schema Zod valida el dato sin lanzar; (b) las 8 causas están presentes; (c) los deltas numéricos son exactamente los de la §7 (`goal:2` como base)
- [X] T022 [P] Escribir `packages/content/src/momentum/__tests__/duelResultTable.test.ts`: (a) el schema Zod valida el dato; (b) los **7 tramos** están presentes (sin huérfanos); (c) `crushingSuccess:1`, `cleanSuccess:0.5`, `forcedAdvance:0`, `splitBall:0`, `simpleLoss:-1`, `disadvantagedLoss:-1.5`, `devastatingCounter:-2`

**Checkpoint:** `pnpm type` verde, `pnpm test packages/content` verde. Los tipos disjuntos de `MomentumEventCause` y `DuelSegment` son verificables en compilación.

---

## Phase 3: Historia 1 — Momentum fluye desde eventos y duelos, afecta la Fuerza (P1)

**Goal:** `applyEvent`, `applyDuelResult`, `createMomentumState`, `computeMomentumModifier` funcionan correctamente. Los tests del `quickstart.md §1` y `§1b` pasan.

**Independent Test:**
```bash
pnpm test packages/core/src/momentum/__tests__/events.test.ts
pnpm test packages/core/src/momentum/__tests__/duelResult.test.ts
pnpm test packages/core/src/momentum/__tests__/modifier.test.ts
pnpm test packages/core/src/momentum/__tests__/exclusivity.test.ts
```

### Tests RED (escribir primero, deben fallar)

- [X] T023 [US1] Escribir `packages/core/src/momentum/__tests__/events.test.ts`: (a) cada una de las 7 causas no-condicionales (`goal`, `specialTechniqueSuccess`, `epicSave`, `oneOnOneSave`, `pressingSteal`, `possessionStreak`, `greatSave`) aplica su delta exacto desde barra 0 — `goal` con delta base +2 (el signo por `side` es responsabilidad de 004, `applyEvent` solo aplica el delta que le pasan); (b) `tideTurningGoal` aplica +3 solo si `state.bar < 0` al momento de invocar, aplica el delta de `goal` (+2) si `bar >= 0` — la condición vive dentro de `applyEvent` (recibe `bar` en el propio `state`, no necesita nada externo); (c) la barra satura en [−5,+5]; (d) `maxReached` nunca baja (invariante 10); (e) `playsAtPeakPositive` sube solo con `bar === 5` exacto y se resetea a 0 al alejarse
- [X] T024 [US1] Escribir `packages/core/src/momentum/__tests__/duelResult.test.ts`: (a) cada uno de los **7 tramos** de `DuelSegment` aplica su delta exacto (tabla de duelos, ninguno queda sin regla); (b) `crushingSuccess` da +1, NO +1.5; (c) `devastatingCounter` da −2, no −3.5; (d) `splitBall` y `forcedAdvance` no mueven momentum (delta 0); (e) el contador `consecutiveWins` se incrementa al ganar (`cleanSuccess`, `crushingSuccess`) y se resetea al perder (cualquier tramo con delta negativo); (f) `splitBall` NO resetea ni incrementa el contador; (g) `forcedAdvance` NO incrementa ni resetea el contador — es progresión, no dominio
- [X] T025 [US1] Escribir `packages/core/src/momentum/__tests__/modifier.test.ts`: (a) `clamp(0.15 × bar, −0.75, +0.75)` para todos los valores de barra enteros [−5,+5] y algunos fraccionales; (b) `bar=0 → 0`; (c) `bar=5 → 0.75`; (d) `bar=-5 → -0.75`; (e) ningún amplificador externo rompe el cap (propiedad fast-check)
- [X] T026 [US1] Escribir `packages/core/src/momentum/__tests__/exclusivity.test.ts` (CE-009, CHK011): (a) `applyDuelResult(state, 'splitBall')` → `state.bar === 0`; (b) `applyEvent(state, 'greatSave')` → `state.bar === 1`; (c) TypeScript no permite pasar un `DuelSegment` a `applyEvent` ni un `MomentumEventCause` a `applyDuelResult` (esto se verifica en compilación, no en runtime — el test documenta la intención con un comentario)
- [X] T027 [US1] Escribir `packages/core/src/momentum/__tests__/events.property.test.ts` (fast-check): (a) `bar` siempre en [−5, +5] para cualquier secuencia arbitraria de `applyEvent`; (b) `maxReached` nunca baja; (c) `computeMomentumModifier(bar)` siempre en [−0.75, +0.75]
- [X] T028 [US1] Escribir `packages/core/src/momentum/__tests__/duelResult.property.test.ts` (fast-check): (a) `bar` siempre en [−5, +5] para cualquier secuencia arbitraria de `applyDuelResult`; (b) `consecutiveWins >= 0` siempre; (c) determinismo: misma secuencia de `DuelSegment` produce mismo `bar`

### Implementación

- [X] T029 [US1] Implementar `createMomentumState(): MomentumState` en `packages/core/src/momentum/state.ts`: retorna `{bar:0, consecutiveWins:0, maxReached:0, playsAtPeakPositive:0, crossedThresholds: new Set(), playerInTheZone: null}`
- [X] T030 [US1] Implementar `saturate(bar: number): number` en `packages/core/src/momentum/state.ts`: `Math.max(-5, Math.min(5, bar))` — usa pasos de 0.5 (no redondea, solo clampea)
- [X] T031 [US1] Implementar la actualización de campos derivados en `state.ts`: función interna `updateDerived(prev: MomentumState, newBar: number): MomentumState` que calcula `maxReached = Math.max(prev.maxReached, newBar)` y `playsAtPeakPositive = newBar === 5 ? prev.playsAtPeakPositive + 1 : 0`
- [X] T032 [US1] Implementar `applyEvent(state: MomentumState, cause: MomentumEventCause): MomentumState` en `packages/core/src/momentum/events.ts`: importa `momentumEventTable` de `@football-rpg/content` (o path relativo según resolución del workspace), aplica delta (con condición especial de `tideTurningGoal`: solo si `state.bar < 0`), llama a `saturate` y `updateDerived`. **No toca `crossedThresholds` ni `playerInTheZone`** — no sabe qué es un umbral.
- [X] T033 [US1] Implementar `applyDuelResult(state: MomentumState, segment: DuelSegment): MomentumState` en `packages/core/src/momentum/duelResult.ts`: importa `momentumDuelResultTable` de `@football-rpg/content`, aplica el delta del tramo más específico (7 tramos, incluido `forcedAdvance` → delta 0), actualiza `consecutiveWins` (incrementa solo si `cleanSuccess|crushingSuccess`; resetea a 0 si cualquier tramo de pérdida; `forcedAdvance` y `splitBall` no cambian el contador), llama a `saturate` y `updateDerived`. **No toca `crossedThresholds` ni `playerInTheZone`** — no sabe qué es un umbral.
- [X] T034 [US1] Implementar `computeMomentumModifier(bar: number): number` en `packages/core/src/momentum/modifier.ts`: `Math.max(-0.75, Math.min(0.75, 0.15 * bar))`; importar `applyDiminishing` de `'../duel'` y documentar (con un comentario de 1 línea) que el resultado se compone con los otros mods en la capa de partido (004), no aquí directamente
- [X] T035 [US1] Verificar CE-007 y CE-005: `grep -n "type: 'momentum'" packages/core/src/duel/events.ts` DEBE salir vacío; `grep -rn "function applyDiminishing" packages/core/src/momentum` DEBE salir vacío

**Checkpoint (US1):** `pnpm test packages/core/src/momentum/__tests__/events.test.ts packages/core/src/momentum/__tests__/duelResult.test.ts packages/core/src/momentum/__tests__/modifier.test.ts packages/core/src/momentum/__tests__/exclusivity.test.ts` verde. Los dos casos del quickstart §1 y §1b pasan manualmente.

---

## Phase 4: Historia 2 — Los umbrales de momentum disparan efectos visibles (P1)

**Goal:** `detectThresholdCrossing` funciona para los 3 tipos de umbral (±3/±4, `ownPeak`, `rivalTrough`), incluyendo re-disparo correcto, cupo único de "en la zona", y el caso `playsAtPeakPositive` continuo.

**Independent Test:**
```bash
pnpm test packages/core/src/momentum/__tests__/thresholds.test.ts
```

### Tests RED

- [X] T036 [US2] Escribir `packages/core/src/momentum/__tests__/thresholds.test.ts` con los grupos de casos siguientes:

  **Umbrales ±3 y ±4 (mecánicos, simétricos):**
  - (a) barra 0→+3 emite `{type:'cardPowerBonus', side, amount:1}` (un efecto exactamente)
  - (b) barra 0→−3 emite `{type:'cardPowerBonus', side, amount:-1}`
  - (c) barra 0→+4 emite `{type:'cardPowerBonus', amount:1}` Y `{type:'extraCardDraw', amount:1}` (cruza +3 y +4)
  - (d) barra +4→+3 después de +3→+4: bajar a +2 y volver a +4 dispara de nuevo; sin bajar a +2 NO dispara de nuevo (re-disparo correcto)
  - (e) barra +1.5→+3.5 (cruce fraccional) emite el efecto exactamente una vez

  **Umbral +5 propio (`ownPeak`):**
  - (f) barra +4→+5 emite `{type:'enteredTheZone', side, playerId:..., triggeredBy:'ownPeak'}` Y `{type:'perfectPlayUnlocked', side}` (dos efectos)
  - (g) si ya existe `playerInTheZone` (cupo lleno), volver a cruzar +5 NO emite segundo `enteredTheZone`; sí re-emite `perfectPlayUnlocked`

  **Umbral −5 rival (`rivalTrough`, detectThresholdCrossing usa MatchMomentumState):**
  - (h) barra rival −4→−5 emite `{type:'enteredTheZone', side: RIVAL, triggeredBy:'rivalTrough'}` en `effects` — `side` es el equipo BENEFICIADO (el que NO tiene la barra a −5), no el que cayó
  - (i) barra rival −4→−5 NO emite `{type:'perfectPlayUnlocked'}` para nadie en `effects`

  **NOTA sobre (j)(k)(o):** los casos de cupo compartido `updateMomentum` van en la sección "Cupo compartido" de `thresholds.test.ts` pero testeando el flujo completo de `updateMomentum`, no `detectThresholdCrossing` aislado. `detectThresholdCrossing` es puro: devuelve un efecto `enteredTheZone` si `before[benefitedSide].playerInTheZone === null` en `before`; pero "si ya existe en `before`" ya implica que `applyThresholdEffects` lo consumió antes — la propiedad de cupo único se verifica sobre la composición completa. Ver T040b para los casos (j)(k)(o).

  **Escenarios Gherkin de `features/003-sistema-momentum.feature`:**
  - (l) re-disparo de +3 y +4 tras bajar y subir de nuevo (Escenario "los umbrales +3 y +4 se re-disparan al cruzar de nuevo")
  - (m) "la barra propia cayendo a -5 NO desbloquea Jugada perfecta para nadie"
  - (n) "en la zona se gana por el -5 del rival"

- [X] T037 [US2] Escribir `packages/core/src/momentum/__tests__/thresholds.property.test.ts` (fast-check): (a) `detectThresholdCrossing` es determinista: mismos `before`/`after`/`movedSide` → mismos efectos; (b) `enteredTheZone` aparece como máximo 1 vez por equipo beneficiado en cualquier secuencia arbitraria de estados before/after

### Implementación

**Arquitectura de tres funciones puras + orquestador (decisión de diseño T039):**

Las tres funciones son independientes y puras. `applyEvent`/`applyDuelResult` solo mueven la barra — no saben qué es un umbral. `detectThresholdCrossing` lee `MatchMomentumState` (incluido `crossedThresholds` y `playerInTheZone`) pero no lo muta. `applyThresholdEffects` registra `crossedThresholds`, consume el cupo de "en la zona" y actualiza `playerInTheZone`. El orquestador `updateMomentum` encadena los tres. Este diseño preserva el Principio 1 (funciones puras, testeable por piezas) y la testeabilidad de `rivalTrough` dentro de la 003.

- [X] T038 [US2] Implementar `createMatchMomentumState(): MatchMomentumState` en `packages/core/src/momentum/state.ts`: retorna `{home: createMomentumState(), away: createMomentumState()}`
- [X] T039 [US2] Implementar `detectThresholdCrossing(before: MatchMomentumState, after: MatchMomentumState, movedSide: MomentumSide): { effects: ThresholdEffect[]; resets: ThresholdReset[] }` en `packages/core/src/momentum/thresholds.ts`:
  - Función pura — NO muta nada. Lee `before` y `after` tal como los recibe.
  - Determinar `barBefore = before[movedSide].bar` y `barAfter = after[movedSide].bar`
  - **`effects` (cruces hacia arriba / activación):**
    - Para cada umbral en `[3, 4, -3, -4]`: si se cruzó (`barBefore < umbral && barAfter >= umbral` para positivos; `barBefore > umbral && barAfter <= umbral` para negativos) Y el umbral NO está en `before[movedSide].crossedThresholds`, emitir el efecto correspondiente
    - Para cruce de +5 (`ownPeak`, `barBefore < 5 && barAfter >= 5`): emitir `perfectPlayUnlocked` (consultar `before`); emitir `enteredTheZone` SOLO si `before[movedSide].playerInTheZone === null`
    - Para cruce de −5 (`rivalTrough`, `barBefore > -5 && barAfter <= -5`): determinar `benefitedSide` (el equipo opuesto); emitir `enteredTheZone` con `triggeredBy:'rivalTrough'` SOLO si `before[benefitedSide].playerInTheZone === null`; NO emitir `perfectPlayUnlocked`
  - **`resets` (cruces hacia abajo / desactivación para re-disparo):**
    - Para cada umbral en `before[movedSide].crossedThresholds`: si `barAfter` ya bajó por debajo del umbral inmediatamente inferior a ese umbral (p. ej. `barAfter < 3` des-activa el umbral +3, `barAfter < 4` des-activa el +4), añadir `{side: movedSide, threshold}` a `resets`
  - **Nota sobre `crossedThresholds`:** la función lee desde `before` (no de `after`) para decidir qué umbrales estaban activos — `after` tiene la barra nueva pero los `crossedThresholds` no actualizados todavía (los actualiza `applyThresholdEffects`). Leer de `before` es correcto para detectar tanto cruces hacia arriba (re-disparo) como cruces hacia abajo (resets).
- [X] T040a [US2] Implementar `applyThresholdEffects(state: MomentumState, effects: ThresholdEffect[], resets: ThresholdReset[], side: MomentumSide): MomentumState` en `packages/core/src/momentum/thresholds.ts`:
  - Primero aplicar `resets`: para cada `r` en `resets` donde `r.side === side`, eliminar `r.threshold` de `crossedThresholds` (esto habilita el re-disparo la próxima vez que la barra cruce ese umbral de nuevo)
  - Luego aplicar `effects` donde `effect.side === side`:
    - `cardPowerBonus` o `extraCardDraw`: añadir el umbral correspondiente a `crossedThresholds`
    - `perfectPlayUnlocked`: añadir `5` (o `−5` según el efecto) a `crossedThresholds`
    - `enteredTheZone`: si `state.playerInTheZone === null`, asignar `{playerId: effect.playerId, triggeredBy: effect.triggeredBy}`; si ya está asignado, no hacer nada (cupo único)
  - Retorna el `MomentumState` actualizado con `crossedThresholds` y `playerInTheZone` correctos
  - **Nota de diseño:** `applyThresholdEffects` NO necesita `barBefore`/`barAfter` — recibe `resets` ya calculados por `detectThresholdCrossing`. Firma limpia sin recalcular nada.
- [X] T040b [US2] Implementar `updateMomentum(match: MatchMomentumState, movedSide: MomentumSide, newBarState: MomentumState): { match: MatchMomentumState; effects: ThresholdEffect[] }` en `packages/core/src/momentum/updateMomentum.ts`:
  - Construir `after: MatchMomentumState` reemplazando `match[movedSide]` con `newBarState` (la barra ya movida por `applyEvent`/`applyDuelResult`)
  - Llamar `const { effects, resets } = detectThresholdCrossing(match, after, movedSide)`
  - Para cada `side` en `['home', 'away']`: aplicar `applyThresholdEffects(after[side], effects, resets, side)` → producir estado con `crossedThresholds` y `playerInTheZone` actualizados
  - Retornar `{ match: matchConEfectos, effects }`
  - **Tests del cupo compartido (F8):** los casos (j)(k)(o) del cupo único de "en la zona" (si ya existe por `ownPeak`, no se concede por `rivalTrough`, y viceversa) se verifican sobre `updateMomentum` en flujo completo (`thresholds.test.ts`, sección "Cupo compartido vía updateMomentum") — no sobre `detectThresholdCrossing` aislado (que solo lee y devuelve, sin consumir el cupo; el consumo es responsabilidad de `applyThresholdEffects`).
  - **Uso típico por 004:**
    ```ts
    let state = applyEvent(match.home, 'goal');
    const { match: next, effects } = updateMomentum(match, 'home', state);
    // next.home tiene bar actualizada, crossedThresholds y playerInTheZone correctos
    // effects contiene los ThresholdEffect[] para que 004 los aplique a la capa de cartas
    ```

**Checkpoint (US2):** `pnpm test packages/core/src/momentum/__tests__/thresholds.test.ts` verde. Los escenarios del `.feature` para umbrales pasan.

---

## Phase 5: Historia 3 — Degradación asimétrica por posesión (P2)

**Goal:** `degradeMomentum` funciona según la §7: positivo −1 sin evento/win, negativo −1 siempre, Determination acelera recuperación, nunca cruza el 0.

**Independent Test:**
```bash
pnpm test packages/core/src/momentum/__tests__/degradation.test.ts
```

### Tests RED

- [X] T041 [US3] Escribir `packages/core/src/momentum/__tests__/degradation.test.ts`:
  - (a) `bar=+3`, `hadSignificantEventOrWin=false` → `bar=+2` tras 1 posesión
  - (b) `bar=+3`, `hadSignificantEventOrWin=true` → `bar=+3` (no degrada si hubo evento/win)
  - (c) `bar=-3`, `hadSignificantEventOrWin=false` → `bar=-2` (degrada siempre en negativo)
  - (d) `bar=-3`, `hadSignificantEventOrWin=true` → `bar=-2` (en negativo degrada incluso con evento)
  - (e) `bar=+0.5`, degradación → `bar=0`, no cruza el 0 (invariante)
  - (f) `bar=-0.5`, degradación → `bar=0`
  - (g) `bar=0`, degradación → `bar=0` (el 0 es estable)
  - (h) Determination 16+ (`determinationAverage >= 16`): `bar=-2` → `bar=0` en 1 posesión (no en 2)
  - (i) `maxReached` no cambia con la degradación (se registra al subir, no al bajar)
- [X] T042 [US3] Escribir `packages/core/src/momentum/__tests__/degradation.property.test.ts` (fast-check): (a) `bar` siempre en [−5, +5] tras degradación; (b) una barra positiva nunca pasa a negativa y viceversa (CE-013); (c) `maxReached` nunca disminuye

### Implementación

- [X] T043 [US3] Implementar `degradeMomentum(state: MomentumState, context: DegradationContext): MomentumState` en `packages/core/src/momentum/degradation.ts`:
  - Si `state.bar > 0` y `!context.hadSignificantEventOrWin`: calcular degradación (normalmente −1; con Determination 16+, degradar 2 pasos hacia 0 a la vez, pero nunca cruzar 0)
  - Si `state.bar < 0`: calcular degradación siempre (normalmente +1 hacia 0; con Determination 16+, +2 hacia 0, nunca cruzar 0)
  - Si `state.bar === 0`: sin cambio
  - Clampear resultado para no cruzar 0: `if (prev > 0 && newBar < 0) newBar = 0; if (prev < 0 && newBar > 0) newBar = 0`
  - `playsAtPeakPositive` se resetea a 0 si el nuevo `bar !== 5`
  - Llamar al `context.traitHook?.overrideDelta?.(...)` si está definido (sin lógica propia del rasgo)
  - Usar `saturate` y `updateDerived` para el estado resultante

**Checkpoint (US3):** `pnpm test packages/core/src/momentum/__tests__/degradation.test.ts` verde. Los escenarios del `.feature` para degradación pasan.

---

## Phase 6: Historia 4 — Determinismo (P1, transversal)

**Goal:** property tests confirman que la misma secuencia de inputs produce siempre el mismo output. Esta historia es transversal — los property tests cruzan los módulos de las historias 1-3.

**Independent Test:**
```bash
pnpm test packages/core/src/momentum/__tests__/*.property.test.ts
```

### Tests RED + Implementación (los tests de propiedad ya fueron escritos en US1-US3)

- [X] T044 [US4] Escribir `packages/core/src/momentum/__tests__/determinism.property.test.ts` (fast-check): secuencia arbitraria mezclada de `applyEvent`, `applyDuelResult`, `degradeMomentum`, `updateMomentum` (que encadena `detectThresholdCrossing` + `applyThresholdEffects`) sobre el mismo estado inicial produce el mismo `MatchMomentumState` y los mismos `ThresholdEffect[]` en dos ejecuciones separadas (CE-001)
- [X] T045 [US4] Verificar que ningún archivo bajo `packages/core/src/momentum/` contiene `Math.random`, `Date.now`, `new Date`, `fetch`, `window`, `document`, `localStorage`, `sessionStorage` (`core-determinism-guard`):
  ```bash
  grep -rnE "Math\.random|Date\.now|new Date|performance\.now|fetch\(|window\.|document\.|localStorage|sessionStorage" packages/core/src/momentum \
    && echo "❌ posible no-determinismo" || echo "✅ momentum limpio"
  ```
- [X] T046 [US4] Verificar que `packages/core/src/momentum` no importa de `apps/` ni de `ui/`:
  ```bash
  grep -rnE "from ['\"](\.\.\/)*(apps|ui)" packages/core/src/momentum \
    && echo "❌ momentum importa de la UI" || echo "✅ dependencias correctas"
  ```

**Checkpoint (US4):** `pnpm test packages/core/src/momentum/__tests__/*.property.test.ts` verde. Los dos greps dan `✅`.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose:** Verificaciones finales de calidad, consistencia de exports y puerta de calidad completa.

- [X] T047 [P] Eliminar los eventos de momentum fósiles de `resolveDuel` (CE-007 precheck): comprobar con `grep -n "type: 'momentum'" packages/core/src/duel/events.ts` — si el resultado NO está vacío, eliminar las ocurrencias (`crushingSuccess`, `disadvantagedLoss`, `devastatingCounter`) y verificar que ningún test de 001/002 dependía de ellas (ejecutar `pnpm test packages/core/src/duel packages/core/src/shot` y asegurarse de que siguen verdes). Esta tarea debe ejecutarse ANTES de que T048 verifique el criterio final.
- [X] T048 [P] Verificar CE-007 final (resolveDuel NO emite momentum tras la limpieza de T047): `grep -n "type: 'momentum'" packages/core/src/duel/events.ts && echo "❌ CE-007 ROTO" || echo "✅ CE-007 OK"` → DEBE dar ✅
- [X] T049 [P] Verificar CE-008 (resolveShot emite ≥3 eventos de momentum): `test "$(grep -c "type: 'momentum'" packages/core/src/shot/events.ts)" -ge 3 && echo "✅ CE-008 OK" || echo "❌"` → DEBE dar ✅
- [X] T050 [P] Verificar CE-005 (no reimplementa applyDiminishing): `grep -rn "function applyDiminishing" packages/core/src/momentum && echo "❌" || echo "✅ CE-005 OK"` → DEBE dar ✅
- [X] T051 Ejecutar la puerta de calidad completa: `pnpm type && pnpm check && pnpm test`; todos deben estar en verde
- [X] T052 Ejecutar `pnpm sim` y verificar CE-014 (jerarquía preservada: jugador medio con momentum +5 sigue perdiendo contra jugador élite con momentum −5); si la simulación existe y está conectada, registrar el resultado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup):** sin dependencias, empieza aquí
- **Phase 2 (Foundational):** depende de Phase 1 — BLOQUEA todo lo demás
- **Phase 3 (US1):** depende de Phase 2
- **Phase 4 (US2):** depende de Phase 3 (necesita `applyEvent`/`applyDuelResult` para construir `MatchMomentumState` y hacer tests end-to-end de umbrales)
- **Phase 5 (US3):** depende de Phase 2 (puede empezar en paralelo con US1 — `degradeMomentum` es independiente de `applyEvent`/`applyDuelResult` y de los umbrales)
- **Phase 6 (US4):** depende de Phase 3, 4 y 5 (el test de determinismo en T044 cruza `updateMomentum` completo)
- **Phase 7 (Polish):** depende de todas las anteriores

### Ejecución paralela dentro de cada fase

**Phase 1:** T001b va tras T001; T002, T003, T004, T006, T007 pueden ejecutarse en paralelo con T001b; T005 y T008 esperan a sus dependencias; T009 va al final.

**Phase 2:** T010–T016 (tipos) pueden ejecutarse en paralelo; T017–T020 (datos Zod) pueden empezar en paralelo con los tipos; T021 y T022 (tests de datos) dependen de T017-T020.

**Phase 3:** T023–T028 (tests RED) pueden ejecutarse en paralelo; T029–T034 (implementación) en orden interno (T029 primero, T030-T031 a continuación, luego T032-T034); T035 al final.

**Phase 4:** T036-T037 (tests RED) primero; T038 en paralelo con T036-T037; T039 a continuación (función pura, lee `before`, no muta); T040a después de T039 (depende de la lógica de umbrales detectada); T040b al final (orquestador, depende de T039 y T040a).

**Phase 5:** T041-T042 (tests RED) en paralelo; T043 a continuación.

**Phase 6:** T044 primero; T045-T046 en paralelo.

**Phase 7:** T047 primero (elimina fósiles, bloquea a T048); T048–T050 en paralelo tras T047; T051 al final; T052 si aplica.

---

## Parallel Example: Historia 1 (US1)

```bash
# Tests RED (en paralelo):
pnpm test --run packages/core/src/momentum/__tests__/events.test.ts       # → FAIL (expected)
pnpm test --run packages/core/src/momentum/__tests__/duelResult.test.ts   # → FAIL (expected)
pnpm test --run packages/core/src/momentum/__tests__/modifier.test.ts     # → FAIL (expected)
pnpm test --run packages/core/src/momentum/__tests__/exclusivity.test.ts  # → FAIL (expected)

# Implementación (secuencial):
# T029 createMomentumState → T030 saturate → T031 updateDerived → T032 applyEvent → T033 applyDuelResult → T034 computeMomentumModifier

# Tests GREEN (verificar):
pnpm test --run packages/core/src/momentum/__tests__/events.test.ts       # → PASS
pnpm test --run packages/core/src/momentum/__tests__/duelResult.test.ts   # → PASS
```

---

## Implementation Strategy

### MVP First (US1 únicamente)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational — tipos y tablas)
3. Complete Phase 3 (US1 — flujo de eventos y modificador de Fuerza)
4. **STOP y VALIDAR:** `pnpm test packages/core/src/momentum/__tests__/events.test.ts packages/core/src/momentum/__tests__/duelResult.test.ts packages/core/src/momentum/__tests__/modifier.test.ts`
5. Los casos del quickstart §1 y §1b pasan

### Incremental Delivery

1. Setup + Foundational → base tipada con tablas validadas
2. US1 → flujo de eventos y mods (visible para 004 cuando exista)
3. US2 → umbrales y efectos one-shot (drama de la capa de cartas)
4. US3 → degradación (dinámica del momentum en partido)
5. US4 + Polish → puerta de calidad cerrada, feature lista para merge

---

## Notes

- `[P]` tasks = archivos distintos, sin dependencias entre ellas
- `[USn]` label indica a qué historia pertenece la tarea
- TDD strict: los tests deben FALLAR antes de implementar — ejecutar con `pnpm test --run` tras escribirlos para confirmar el rojo
- La revisión de diseño antes de T039 es obligatoria: la gestión de `crossedThresholds` en `after` tiene implicaciones en T032/T033
- `pnpm sim` (CE-014) solo aplica si el harness de simulación está conectado al pipeline de momentum; si no existe integración en 004 todavía, documentar como pendiente
- No commitear hasta que el usuario lo pida explícitamente
- Verficiar `pnpm type` + `pnpm check` + `pnpm test` antes de dar la tarea por terminada
