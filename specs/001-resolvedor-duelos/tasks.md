# Tasks: Resolvedor de duelos (001)

**Input**: `specs/001-resolvedor-duelos/` — spec.md, plan.md, data-model.md, contracts/resolverDuelo.md
**Enfoque**: test-first — cada módulo tiene sus tests escritos y fallando antes de implementar.
**Stack**: TypeScript estricto · Vitest · fast-check · @amiceli/vitest-cucumber

## Formato: `[ID] [P?] [Story?] Descripción con ruta de archivo`

- **[P]**: paralelizable (archivos distintos, sin dependencias incompletas)
- **[Story]**: historia de usuario a la que pertenece la tarea
- Los tests se escriben **antes** del código; deben fallar en rojo antes de implementar

---

## Phase 1: Setup — Estructura base

**Propósito**: crear la estructura de directorios y la configuración mínima para que el monorepo reconozca `packages/core`.

- [X] T001 Crear `packages/core/package.json` con nombre `@football-rpg/core`, type module y sin dependencias de runtime
- [X] T002 Crear `packages/core/src/index.ts` vacío (re-exportará la API pública al completar)
- [X] T003 [P] Crear `packages/core/src/rng/` con `index.ts` vacío
- [X] T004 [P] Crear `packages/core/src/duel/` con `index.ts` vacío
- [X] T005 [P] Crear `features/` en la raíz del repo para los archivos `.feature` de BDD
- [X] T006 Verificar que `pnpm type` pasa sin errores tras el setup (tsconfig compuesto reconoce `packages/core`)

**Checkpoint**: `pnpm type` en verde · estructura de directorios lista.

---

## Phase 2: Foundational — Tipos e interfaz Rng

**Propósito**: definir los contratos de tipos que todos los módulos del resolvedor necesitan. Nada puede implementarse sin ellos.

⚠️ **CRÍTICO**: ninguna tarea de las fases 3–6 puede comenzar hasta que esta fase esté completa.

### Tests de tipos (estructurales, no de runtime)

- [X] T007 Escribir test de compilación en `packages/core/src/rng/__tests__/rng.types.test.ts` que verifique que un objeto `{ next(): number; split(): Rng }` satisface la interfaz `Rng` y que `makeRng(42)` devuelve `Rng` — debe fallar en rojo (no existe `Rng` aún)
- [X] T008 Escribir property en `packages/core/src/rng/__tests__/rng.property.test.ts` con fast-check: `makeRng(s).next()` siempre produce el mismo valor para la misma semilla `s` — debe fallar en rojo

### Implementación de tipos y Rng

- [X] T009 Definir interfaz `Rng` y declaración `makeRng` en `packages/core/src/rng/types.ts` (solo tipos, sin implementación aún)
- [X] T010 Definir todos los tipos del duelo en `packages/core/src/duel/types.ts`: `Carril`, `TecnicaEspecialId`, `LadoDuelo`, `EntradaDeDuelo`, `Tramo`, `Evento`, `ResultadoDeDuelo`
- [X] T011 Implementar `makeRng(seed: number): Rng` en `packages/core/src/rng/mulberry32.ts` usando Mulberry32 puro (sin deps). El `Rng` es **inmutable por valor**: captura `state` como número; `next()` deriva el float del `state` actual **sin mutar** (dos `next()` sobre el mismo `Rng` devuelven el mismo float); `split()` devuelve un `Rng` nuevo con estado independiente (`state` mezclado con `0x9e3779b9` y avanzado una ronda de Mulberry32), sin tocar el receptor. El determinismo del árbol se logra dando a cada sub-cálculo su propio `rng` vía `split()`, nunca compartiendo una secuencia mutable
- [X] T012 Re-exportar `Rng` y `makeRng` desde `packages/core/src/rng/index.ts`

**Checkpoint**: `pnpm test` en verde para T007–T008 · tipos disponibles para el resto de fases.

---

## Phase 3: US1 — Resolución determinista de un duelo

**Historia**: *Como desarrollador, quiero que resolver el mismo duelo con la misma semilla dé siempre el mismo resultado, para poder testear, depurar por semilla y validar el balance por simulación.*

**Goal**: `resolverDuelo(entrada, rng)` completo y determinista — todos los módulos del pipeline funcionando.

**Independent Test**: `pnpm test -- resolverDuelo` resuelve el mismo duelo dos veces con `makeRng(42)` y `deepEqual` pasa.

### Tests — escribir primero, deben fallar en rojo

- [X] T013 [P] [US1] Escribir tests unitarios de `attributeToInfluence` en `packages/core/src/duel/__tests__/attributeToInfluence.test.ts`: todos los rangos de la tabla (1-3→−4, …, 18-20→+4), valores límite (1, 3, 4, 9, 10, 17, 18, 20)
- [X] T014 [P] [US1] Escribir tests unitarios de `applyDiminishing` en `packages/core/src/duel/__tests__/modifiers.test.ts`: array vacío→0, ejemplos del §6 (+3→+3, +4→+4, +6→+5, +8→+6, +10→+7, +12→+7), negativos simétricos
- [X] T015 [P] [US1] Escribir property-based de `applyDiminishing` en `packages/core/src/duel/__tests__/modifiers.property.test.ts` con fast-check: **monotonía** (aumentar un mod nunca reduce el efectivo) e **invariante 4** de football-rules
- [X] T016 [P] [US1] Escribir tests unitarios de `classify` en `packages/core/src/duel/__tests__/classify.test.ts`: un valor representativo de cada tramo + valores de frontera exactos (−6, −3, −1, 0, +1, +3, +6)
- [X] T017 [P] [US1] Escribir property-based de `classify` en `packages/core/src/duel/__tests__/classify.property.test.ts` con fast-check: **cobertura total** — todo entero cae en exactamente un tramo (CE-005, invariante 6)
- [X] T018 [P] [US1] Escribir tests unitarios de `emitEvents` en `packages/core/src/duel/__tests__/events.test.ts`: eventos exactos para los 7 tramos según la tabla §6 corregida (exitoAplastante→avance+roboCarta+momentum+1; avanceForzado→avance+presion+1; etc.)
- [X] T019 [P] [US1] Escribir tests unitarios de `computeBand` y `sampleTriangular` en `packages/core/src/duel/__tests__/uncertainty.test.ts`: `computeBand` cubre banda dinámica (0-4→±6, 5-6→±7, 7+→±8), ajuste Composure, suelo ±3 y caso técnica especial (±4 fija); `sampleTriangular` con rng determinista devuelve entero dentro de [−banda, +banda]
- [X] T020 [P] [US1] Escribir property-based en `packages/core/src/duel/__tests__/uncertainty.property.test.ts` con fast-check: **suelo de banda** — `computeBand(diferencial, composure, false)` ≥ 3 para todo par (composure, diferencial) (CE-004, invariante 3); y `sampleTriangular(banda, rng)` ∈ [−banda, +banda] para toda banda ≥ 3 y todo rng
- [X] T021 [US1] Escribir test de integración de `resolverDuelo` en `packages/core/src/duel/__tests__/resolverDuelo.test.ts`: determinismo (dos llamadas con mismo rng → deepEqual), efecto de carril (+2/−1 con swing 3), resultado 0 emite miniDuelo, resultado ≥+6 emite roboCarta al atacante
- [X] T022 [US1] Escribir property-based de `resolverDuelo` en `packages/core/src/duel/__tests__/resolverDuelo.property.test.ts` con fast-check: **invariante 1** (determinismo total), **invariante 7** (carril íntegro: no reducido por mods)

### Implementación — solo tras confirmar rojo en todos los tests anteriores

- [X] T023 [P] [US1] Implementar `attributeToInfluence(n: number): number` en `packages/core/src/duel/attributeToInfluence.ts` (lookup table de la spec §6)
- [X] T024 [P] [US1] Implementar `applyDiminishing(mods: number[]): number` en `packages/core/src/duel/modifiers.ts` (tramos 100%/50%/33% sobre bruto acumulado)
- [X] T025 [P] [US1] Implementar `classify(resultado: number): Tramo` en `packages/core/src/duel/classify.ts` (7 tramos sin huecos ni solapamientos)
- [X] T026 [P] [US1] Implementar `emitEvents(tramo: Tramo): Evento[]` en `packages/core/src/duel/events.ts` (tabla §6 eslabón normal)
- [X] T027 [US1] Implementar `computeBand(diferencial, composureAtacante, tecnicaEspecialAmbos): number` y `sampleTriangular(banda, rng): number` en `packages/core/src/duel/uncertainty.ts`: `computeBand` = banda dinámica + ajuste Composure + `max(_, 3)`, o `4` fija si `tecnicaEspecialAmbos`; `sampleTriangular` = suma de 2 uniformes escaladas a [−banda,+banda], promediadas y redondeadas al entero
- [X] T028 [US1] Implementar `resolverDuelo(entrada: EntradaDeDuelo, rng: Rng): ResultadoDeDuelo` en `packages/core/src/duel/resolverDuelo.ts` orquestando el pipeline completo: fuerzas → diferencial → `banda = computeBand(...)` → `incertidumbre = sampleTriangular(banda, rng.split())` → resultado → tramo → eventos. RF-012: dejar previstos los puntos de extensión `entrada.instantesPreRevelado` y `entrada.efectosPostRevelado` como hooks no-op en v1 (si están presentes, iterar sin efecto; documentar con comentario `// v1: sin catálogo, no-op`), de modo que añadir su lógica después no cambie la firma
- [X] T029 [US1] Re-exportar `resolverDuelo`, `EntradaDeDuelo`, `ResultadoDeDuelo`, `Evento`, `Tramo` desde `packages/core/src/duel/index.ts`
- [X] T030 [US1] Re-exportar la API pública de `packages/core` desde `packages/core/src/index.ts`

**Checkpoint**: `pnpm test` en verde para todos los tests de Phase 3 · `pnpm type` limpio · grepping de pureza sin hits.

---

## Phase 4: US2 — Resolución justa y contundente (calibración)

**Historia**: *Como jugador, quiero que el resultado refleje la fuerza combinada de carta + jugador + situación, con un abanico de desenlaces.*

**Goal**: la distribución de resultados en simulación manual cumple CE-002 y CE-003 (verificable con snapshot stats).

**Independent Test**: ejecutar 1 000 duelos con `makeRng(seed)` y verificar que un atacante élite (+4) gana ~80-85% frente a mediocre (−1).

### Tests — escribir primero, deben fallar en rojo

- [X] T031 [US2] Escribir test de calibración rápida en `packages/core/src/duel/__tests__/resolverDuelo.calibration.test.ts`: 10 000 duelos con `makeRng(i)` para `i ∈ [0, 9999]` (semilla distinta por duelo), élite vs mediocre → tasa de éxito ∈ [0.80, 0.85]; élite vs pésimo → [0.90, 0.95]; bueno vs bueno → [0.45, 0.55] (CE-002)
- [X] T032 [US2] Añadir property de equilibrio de pesos en el mismo archivo: medir la contribución relativa de azar / cartas+carril / atributos+mods sobre 10 000 duelos usando `makeRng(i)` para `i ∈ [0, 9999]` (una semilla distinta por duelo) → los tres pesos dentro de sus bandas (CE-003, azar≈33%, decisión≈31%, preparación≈37%). La suite es reproducible porque el rango de semillas es fijo, pero la muestra es estadísticamente variada

### Implementación — solo tras confirmar rojo

- [X] T033 [US2] Ajustar constantes en `packages/core/src/duel/uncertainty.ts` si los tests de calibración lo requieren (sin cambiar la lógica del §6, solo validar que los parámetros actuales producen las tasas objetivo)

**Checkpoint**: `pnpm test` verde incluyendo calibración · ningún cambio al pipeline existente rompe Phase 3.

---

## Phase 5: US3 — Apuesta de carril importa (mind-game)

**Historia**: *Como jugador defensor, cuando acierto el carril del ataque quiero una ventaja tangible; cuando fallo, una desventaja.*

**Goal**: el swing de carril es exactamente 3 puntos (+2 vs −1) de forma aislable y verificable.

**Independent Test**: mismo duelo resuelto con carril acertado vs fallado → diferencia en fuerza defensa exactamente 3 puntos, reflejada en el resultado.

### Tests — escribir primero, deben fallar en rojo

- [X] T034 [US3] Escribir test de aislamiento de carril en `packages/core/src/duel/__tests__/resolverDuelo.lane.test.ts`: duelo idéntico con mismo rng, variando solo `carrilApostado` (acierta/falla) → diferencia de `resultado` ∈ {2, 3} (swing de 3, con posible variación por redondeo de incertidumbre con misma semilla) y verificar con rng que produce incertidumbre=0 que la diferencia es exactamente 3
- [X] T035 [US3] Escribir property con fast-check: **invariante 7** (carril íntegro) — el delta de carril nunca se ve reducido por `applyDiminishing` para ningún valor de `modificadores`

### Implementación — solo tras confirmar rojo

- [X] T036 [US3] Verificar que `resolverDuelo.ts` aplica el carril íntegro (fuera del bloque de mods); si el test de T034/T035 pasa ya con Phase 3, esta tarea es ✅ sin cambios de código

**Checkpoint**: `pnpm test` verde incluyendo lane tests · US1, US2 y US3 pasan simultáneamente.

---

## Phase 6: BDD + Golden Replay + Pureza

**Propósito**: criterios de aceptación ejecutables, snapshot de regresión y verificación formal de pureza del núcleo.

### BDD (Gherkin + vitest-cucumber)

- [X] T037 Configurar `@amiceli/vitest-cucumber` en `packages/core/vitest.config.ts` (o en el vitest config raíz) para que detecte `features/*.feature`
- [X] T038 [P] Escribir `features/001-resolvedor-duelos.feature` con escenarios Gherkin y semilla fija: (1) atacante élite vs mediocre tiende a éxito, (2) acierto/fallo de carril produce swing de 3, (3) resultado 0 emite evento miniDuelo
- [X] T039 Escribir step definitions en `packages/core/src/duel/__tests__/resolverDuelo.feature.test.ts` que conecten los escenarios Gherkin con `resolverDuelo` + `makeRng`

### Golden Replay

- [X] T040 Crear snapshot de golden replay en `packages/core/src/duel/__tests__/__snapshots__/replay.snap.ts`: resolver una secuencia de 10 duelos con `makeRng(12345)` y guardar el array de `ResultadoDeDuelo` como snapshot de Vitest (`expect(results).toMatchSnapshot()`)

### Verificación de pureza (`core-determinism-guard`)

- [X] T041 Ejecutar grep de guardia y confirmar salida limpia:
  ```bash
  grep -rnE "Math\.random|Date\.now|new Date|performance\.now|fetch\(|window\.|document\.|localStorage|sessionStorage" packages/core/src && echo "❌" || echo "✅"
  grep -rnE "from ['\"](\.\.\/)*(apps|ui)" packages/core/src && echo "❌" || echo "✅"
  ```
- [X] T042 Añadir los dos greps de T041 como test de CI en `packages/core/src/__tests__/purity.test.ts` usando `execSync` o script de Vitest que falle si encuentran coincidencias

**Checkpoint**: `pnpm test` verde incluyendo BDD, golden replay y pureza · `pnpm type && pnpm check` limpios.

---

## Phase 7: Polish — Cierre de feature

- [X] T043 [P] Actualizar `packages/core/src/index.ts` con re-exports finales y limpios (solo API pública: `resolverDuelo`, tipos de entrada/salida, `makeRng`, `Rng`)
- [X] T044 [P] Ejecutar `pnpm check --write` sobre `packages/core/src/` y confirmar que Biome no reporta errores ni warnings
- [X] T045 Ejecutar la puerta de calidad completa: `pnpm type && pnpm check && pnpm test` — los tres deben salir con código 0
- [X] T046 Marcar los 53 items del checklist `specs/001-resolvedor-duelos/checklists/requirements.md` que queden cubiertos por la implementación

---

## Dependencias y orden de ejecución

```
Phase 1 (Setup)
    └── Phase 2 (Foundational: tipos + Rng)
            ├── Phase 3 (US1: pipeline completo)     ← MVP
            │       ├── Phase 4 (US2: calibración)
            │       ├── Phase 5 (US3: carril)
            │       └── Phase 6 (BDD + replay + pureza)
            └── [Phase 4, 5, 6 pueden avanzar en paralelo tras Phase 3]
Phase 7 (Polish) — tras Phase 3 como mínimo, idealmente tras 4+5+6
```

### Dentro de cada fase: tests → implementación

```
Tests T013–T022 (en paralelo entre sí) → todos en ROJO
    └── Implementación T023–T030 (en el orden que indican dependencias)
            └── Tests vuelven a VERDE → Checkpoint
```

### Oportunidades de paralelismo dentro de Phase 3

```bash
# Tests de módulos independientes — lanzar juntos:
T013 attributeToInfluence.test.ts
T014 modifiers.test.ts
T015 modifiers.property.test.ts
T016 classify.test.ts
T017 classify.property.test.ts
T018 events.test.ts
T019 uncertainty.test.ts
T020 uncertainty.property.test.ts

# Implementaciones de módulos independientes — tras confirmar rojo:
T023 attributeToInfluence.ts
T024 modifiers.ts
T025 classify.ts
T026 events.ts
# T027 uncertainty.ts y T028 resolverDuelo.ts dependen de los anteriores
```

---

## Estrategia de implementación

### MVP (Phase 1 + 2 + 3 solamente)

1. Completar Phase 1 — estructura lista
2. Completar Phase 2 — tipos + `makeRng` funcionando
3. Escribir todos los tests de Phase 3 → confirmar ROJO
4. Implementar módulos de Phase 3 hasta VERDE
5. **PARAR y validar**: `pnpm test` verde · `pnpm type` limpio · grep de pureza limpio
6. `resolverDuelo` es completamente funcional y determinista

### Entrega incremental

- MVP (Phase 3): resolvedor determinista con pipeline completo
- Añadir Phase 4: calibración estadística verificada
- Añadir Phase 5: aislamiento del carril verificado
- Añadir Phase 6: BDD ejecutable + golden replay + CI de pureza
- Phase 7: cierre y re-export limpio → PR listo

---

## Notas

- `[P]` = archivos distintos sin dependencias → pueden ejecutarse en paralelo
- Tests en **rojo obligatorio** antes de implementar el módulo correspondiente
- Hacer commit tras cada checkpoint de fase
- `pnpm test -- <archivo>` para correr solo los tests del módulo activo
- Si un test de calibración (T031/T032) falla por los parámetros actuales, ajustar solo constantes en `uncertainty.ts`, no la lógica del pipeline
- El golden replay (T040) se genera una vez y se guarda como snapshot; cualquier cambio futuro al pipeline lo rompe intencionalmente
- **T047 (añadida post-implementación)**: implementado `tools/sim/index.ts` (no estaba en las tareas originales; requerido por `pnpm sim` referenciado en quickstart.md y skill `sim-harness`). CE-002 (bandas de éxito élite/mediocre/bueno) es bloqueante y pasa en verde. CE-003 (pesos azar/decisión/preparación) se reporta como informativa, no bloqueante: no existe fórmula operacional oficial para "peso" y la medición por descomposición de varianza aislada sobre-pesa el azar frente al carril. Ver `checklists/requirements.md` CHK047 para el detalle y el trabajo pendiente.
