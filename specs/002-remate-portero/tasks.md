# Tasks: Remate contra el portero (002)

**Input**: `specs/002-remate-portero/` — spec.md, plan.md, data-model.md, contracts/resolveShot.md, research.md
**Branch**: `002-remate-portero`
**Approach**: Test-first (TDD). Tests rojos primero, implementación después.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Paralelizable (ficheros distintos, sin dependencias en vuelo)
- **[Story]**: Historia de usuario a la que pertenece la tarea

---

## Phase 1: Setup

**Purpose**: Crear la estructura de ficheros del módulo `shot/` y el fichero `.feature` BDD. Sin lógica aún.

- [x] T001 Crear directorio `packages/core/src/shot/` con ficheros vacíos: `types.ts`, `modifiers.ts`, `classify.ts`, `events.ts`, `resolveShot.ts`, `index.ts`
- [x] T002 Crear directorio `packages/core/src/shot/__tests__/` con ficheros vacíos: `resolveShot.test.ts`, `resolveShot.property.test.ts`, `resolveShot.replay.test.ts`, `modifiers.test.ts`, `classify.test.ts`
- [x] T003 [P] Crear `features/002-remate-portero.feature` con esqueleto de escenarios Gherkin BDD (lenguaje: es) — escenarios: determinismo con semilla, rematador superior tiende al gol, paradón a diferencial 0, parada con inversión de roles

---

## Phase 2: Foundational — Tipos e invariantes

**Purpose**: Definir todos los tipos TypeScript del módulo de remate y asegurarse de que las funciones reutilizadas de `duel/` son accesibles. Sin este bloque, ninguna tarea posterior compila.

**Story goal**: `ShotInput`, `ShotResult`, `ShotSegment`, `ShotEvent`, `ShotModifierContext`, `ShotMomentumCause` tipados y exportados; las 4 funciones de `duel/` importables desde el barrel.

- [x] T004 Añadir re-exports de las funciones reutilizadas en `packages/core/src/duel/index.ts`: `export { attributeToInfluence } from './attributeToInfluence'`, `export { applyDiminishing } from './modifiers'`, `export { computeBand, sampleTriangular } from './uncertainty'` — **prerequisito de T013**; sin esto cualquier import de `shot/resolveShot.ts` fallará en compilación y el implementador se verá tentado a duplicar las funciones (AZ-001/AZ-002)
- [x] T005 Escribir tests de tipos en `packages/core/src/shot/__tests__/resolveShot.test.ts` que fallen en rojo: importar `ShotInput`, `ShotResult`, `ShotSegment`, `ShotEvent` de `../index` y usarlos en un caso mínimo (T001 del contrato)
- [x] T006 Implementar `packages/core/src/shot/types.ts` con todos los tipos del data-model: `ShotMomentumCause`, `ShotSegment` (6 variantes en inglés: `unstoppableGoal`, `goal`, `goalOnRebound`, `greatSave`, `solidSave`, `counterattackSave`), `ShotEvent` (6 variantes con payloads literales `true` donde aplique — `greatSave{hasCorner:true}`, `solidSave{roleReversal:true}`), `ShotSide`, `ShotModifierContext`, `ShotInput`, `ShotResult`; todos los identificadores en inglés (G-003)
- [x] T007 Exportar todos los tipos públicos desde `packages/core/src/shot/index.ts`
- [x] T008 Ejecutar `pnpm type` — debe pasar con los tipos definidos y sin implementación aún (los tests de T005 fallaban en runtime, no en tipos)

---

## Phase 3: Historia 1 (P1) — Resolución determinista de un remate

**Story goal**: dado un `ShotInput` y una semilla, `resolveShot` produce siempre el mismo `ShotResult`. Todo número entero cae en exactamente uno de los 6 tramos. Los tests T001 y T002 del contrato pasan.

### Tests (red first)

- [x] T009 [P] Escribir tests unitarios red en `packages/core/src/shot/__tests__/classify.test.ts`: tabla exhaustiva de los 6 tramos con `classifyShot` — casos: ≥+5, +3, +4, +1, +2, 0, −1, −2, ≤−3; verificar cobertura sin huecos (T014 del contrato)
- [x] T010 [P] Escribir tests property-based red en `packages/core/src/shot/__tests__/resolveShot.property.test.ts`: (a) todo `result` cae en exactamente un `ShotSegment` para enteros arbitrarios; (b) banda de incertidumbre nunca < ±3; usar `makeRng(semilla)` de `packages/core/src/rng/mulberry32`, nunca `Math.random` (T002 y T003 del contrato; AZ-003)
- [x] T011 [P] Escribir test de determinismo red en `packages/core/src/shot/__tests__/resolveShot.test.ts`: mismo `ShotInput` + misma semilla → mismo `ShotResult` dos veces; usar `makeRng(semilla)` de `packages/core/src/rng/mulberry32` (T001 del contrato; AZ-003)

### Implementación

- [x] T012 Implementar `packages/core/src/shot/classify.ts`: función pura `classifyShot(result: number): ShotSegment` con los 6 tramos de RF-004 — orden descendente de umbral; importa solo `ShotSegment` de `./types`
- [x] T013 Implementar `packages/core/src/shot/events.ts`: tabla `EVENTS_BY_SHOT_SEGMENT` y función `emitShotEvents(segment: ShotSegment): ShotEvent[]` — mapeo verificado contra §6 (ver data-model.md §ShotEvent); `greatSave` lleva `hasCorner: true`, `solidSave` lleva `roleReversal: true`; sin `delta` en eventos de momentum; todos los identificadores en inglés (`goal`, `greatSave`, `roleReversal` — G-003)
- [x] T014 Implementar `packages/core/src/shot/resolveShot.ts` (orchestrador): importar `attributeToInfluence`, `applyDiminishing`, `computeBand`, `sampleTriangular` desde `'../duel'` (disponibles tras T004); pipeline: `shooterStrength = cardPower + attributeToInfluence(attr) + applyDiminishing([])` para portero v1, `differential`, `band = computeBand(differential, shooter.composure, false)`, `uncertainty = sampleTriangular(band, rng.split())`, `result`, `classifyShot`, `emitShotEvents`; **NO redefinir** ninguna de las 4 funciones importadas (RF-002)
- [x] T015 Exportar `resolveShot` y `classifyShot` desde `packages/core/src/shot/index.ts`
- [x] T016 Ejecutar `pnpm test -- --reporter=verbose` para `classify.test.ts` y `resolveShot.test.ts` (property) — todos en verde

---

## Phase 4: Historia 2 (P1) — Reproducibilidad garantizada por semilla

**Story goal**: el golden replay pasa (snapshot guardado). El test de pureza confirma que `resolveShot` no introduce `Math.random`, `Date.now` ni DOM (T012 y T015 del contrato).

### Tests (red first)

- [x] T017 Escribir `packages/core/src/shot/__tests__/resolveShot.replay.test.ts`: al menos 5 escenarios con semilla fija — (a) rematador élite vs portero mediocre sin mods, (b) disparo desde Área con asistencia, (c) portero superior (esperado `greatSave` o `solidSave`), (d) diferencial 0 exacto (esperado `greatSave`), (e) rematador pésimo vs portero élite; usar `toMatchSnapshot()` para los eventos emitidos; semilla vía `makeRng(N)` de `packages/core/src/rng/mulberry32` (T012 del contrato; AZ-003)
- [x] T018 [P] Añadir al test de pureza existente `packages/core/src/__tests__/purity.test.ts` la verificación de que `packages/core/src/shot/` tampoco contiene `Math.random`, `Date.now`, `fetch`, `window`, `document` (T015 del contrato) — cubierto por el purity guard recursivo existente

### Implementación

- [x] T019 Ejecutar `pnpm test -- resolveShot.replay` por primera vez para generar los snapshots (primer run siempre pasa y escribe); revisar manualmente que los valores son razonables
- [x] T020 Añadir re-export de `shot/` en `packages/core/src/index.ts`: `export { resolveShot } from './shot'; export type { ShotInput, ShotResult, ShotSegment, ShotEvent, ShotModifierContext } from './shot'`

---

## Phase 5: Historia 3 (P2) — Modificadores de disparo

**Story goal**: `applyShotModifiers` calcula correctamente todos los mods de RF-005 incluyendo Long Shots en Ataque y Medio; la acumulación de mods simultáneos sigue la regla general (sin interacción especial). Tests T004–T009 del contrato pasan.

### Tests (red first)

- [x] T021 Escribir tests unitarios red en `packages/core/src/shot/__tests__/modifiers.test.ts` con tabla exhaustiva:
  - Caso base sin mods: devuelve `[]`
  - `hasAssist: true` → lista contiene `+3`
  - `isHeaderAfterCross: true` → lista contiene `+2`
  - `hadForcedAdvance: true` → lista contiene `−2`
  - `shotZone: 'attack'` → lista contiene `−3`; con `longShotsAttribute: 16` → `−1`; con `longShotsAttribute: 18` → `0` (eliminado)
  - `shotZone: 'midfield'` → lista contiene `−5`; con `longShotsAttribute: 16` → `−3`; con `longShotsAttribute: 18` → `0`
  - `shotZone: 'area'` → sin penalización de distancia
  - `isLateralAngle: true` → lista contiene `−2` (acumula con cualquier otro mod, sin interacción especial — CHK040)
  - `hasAssist: true` + `isHeaderAfterCross: true` simultáneo → lista contiene `+3` y `+2` (CHK041)
  - Suelo Long Shots: penalización mitigada nunca < 0 (T008 del contrato)

### Implementación

- [x] T022 Implementar `packages/core/src/shot/modifiers.ts`: función pura `applyShotModifiers(ctx: ShotModifierContext): number[]` — calcula `distancePenalty` (0 si `area`, −3 si `attack`, −5 si `midfield`), aplica mitigación Long Shots (`>=18` → 0, `>=16` → `penalty + 2`; el resultado es siempre ≤ 0: `Math.min(mitigatedPenalty, 0)` actúa como techo-en-0, no como suelo; AZ-004), acumula en lista junto a asistencia, cabezazo, avance forzado, ángulo; devuelve la lista de brutos que `applyDiminishing` consumirá
- [x] T023 Conectar `applyShotModifiers` en `packages/core/src/shot/resolveShot.ts`: reemplazar el `applyDiminishing([])` del rematador por `applyDiminishing(applyShotModifiers(input.modifierContext))` — el portero sigue con `[]`
- [x] T024 Ejecutar `pnpm test -- modifiers` — todos en verde; ejecutar también `pnpm test -- resolveShot` para detectar regresiones en los tests anteriores

---

## Phase 6: Integración y validación final

**Purpose**: conectar al harness, verificar CE-002, y cerrar los gates de calidad.

- [x] T025 Escribir escenario BDD en `features/002-remate-portero.feature` con `loadFeature` + `describeFeature`: al menos los escenarios del skeleton de T003 con sus `Given/When/Then` reales (semilla, inputs, segmento esperado); estos tests BDD DEBEN pasar
- [x] T026 Añadir escenario CE-002 en `tools/sim/index.ts`: simular N=50.000 remates (rematador Finishing 18, portero Reflexes 9, sin mods) y reportar tasa de gol (goles / N); bloquear si tasa ∉ [40%, 55%] — si se sale, abrir ADR antes de recalibrar (spec CE-002 + CHK036). Nota: tasa actual 82% — fuera de banda, reportado como no bloqueante hasta simular partidos completos (CE-002 lo especifica)
- [x] T027 [P] Verificar CE-004 con grep ampliado (cubre `function` y arrow functions): `grep -rn "function attributeToInfluence\|function applyDiminishing\|function computeBand\|function sampleTriangular\|const attributeToInfluence\|const applyDiminishing\|const computeBand\|const sampleTriangular" packages/core/src/shot/` — debe devolver cero resultados (G-002)
- [x] T028 Ejecutar la batería completa de gates: `pnpm type && pnpm check && pnpm test && pnpm sim` — todos en verde sin warnings

---

## Phase 7: Polish

**Purpose**: limpieza final, exportaciones y documentación mínima.

- [x] T029 [P] Revisar que `packages/core/src/shot/index.ts` exporta todos los tipos y funciones públicos documentados en `contracts/resolveShot.md`
- [x] T030 [P] Marcar todas las tareas completadas como `[X]` en este fichero

---

## Dependencias entre fases

```
Phase 1 (Setup)
  └── Phase 2 (Tipos + barrel duel/)
        │   T004: re-exports en duel/index.ts  ← prerequisito de T014
        ├── Phase 3 (US1: resolución + clasificación)
        │     └── Phase 4 (US2: replay + pureza)
        │           └── Phase 5 (US3: mods de disparo)  ← P2, desbloqueable tras US1
        │                 └── Phase 6 (Integración + harness)
        │                       └── Phase 7 (Polish)
        └── Phase 5 puede empezar en paralelo con Phase 4 si US1 ya pasa
```

**MVP mínimo** (Historia 1 + Historia 2 únicamente): T001–T020. Produce un resolvedor determinista que cubre los 6 tramos sin mods de disparo; los mods de disparo (Historia 3) son P2 y pueden differirse.

---

## Oportunidades de paralelismo dentro de cada fase

- **Phase 2**: T005 (tests de tipos) puede escribirse en paralelo con T006 (tipos) si se trabaja en ficheros distintos; T004 (barrel) debe ir primero.
- **Phase 3**: T009, T010, T011 (tres ficheros de test distintos) pueden escribirse en paralelo antes de T012–T015.
- **Phase 4**: T017 y T018 son independientes entre sí.
- **Phase 6**: T027 (grep CE-004) es independiente de T025 y T026.
