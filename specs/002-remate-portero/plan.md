# Implementation Plan: Remate contra el portero

**Branch**: `002-remate-portero` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/002-remate-portero/spec.md`

---

## Summary

Implementar `resolveShot(input, rng)` en `packages/core/src/shot/` — un resolvedor puro y determinista del remate contra el portero. Reutiliza sin duplicar las funciones compartidas de `packages/core/src/duel/` (compresión de atributos, rendimientos decrecientes, `computeBand`, `sampleTriangular`, `Rng`). Solo añade: la tabla de remate de 6 tramos asimétricos, los modificadores de disparo (asistencia, cabezazo, disparo lejano + Long Shots, ángulo), y las variantes de evento de remate con momentum semántico (sin delta numérico).

---

## Technical Context

**Language/Version**: TypeScript 5.x, modo estricto (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).

**Primary Dependencies**:
- `packages/core/src/duel/` — funciones reutilizadas: `attributeToInfluence`, `applyDiminishing`, `computeBand`, `sampleTriangular`; tipo `Rng`.
- `packages/core/src/rng/` — `makeRng`, `splitN`, `Rng`.
- Vitest + fast-check — tests unitarios y property-based.
- `@amiceli/vitest-cucumber` — escenarios BDD/Gherkin.
- Biome — lint + format.

**Storage**: N/A (motor puro, sin estado persistente).

**Testing**: Vitest (`pnpm test`), fast-check (invariantes), golden replay (snapshot), `pnpm sim` (harness CE-002).

**Target Platform**: ESM puro, ejecutable en Node (Vitest) y navegador (Vite). Sin APIs de browser en `packages/core`.

**Project Type**: librería interna (`packages/core`).

**Performance Goals**: determinismo y correctitud; no hay objetivos de latencia (duelos son <1 ms).

**Constraints**: motor puro — cero `Math.random`, `Date.now`, `fetch`, `window/document/DOM` en `packages/core` (ver skill `core-determinism-guard`). Sin nuevo backend. Sin duplicar lógica de `duel/`.

**Scale/Scope**: un único remate, stateless. No modela cadena de posesión completa.

---

## Constitution Check

*GATE: verificado antes de proceder a Phase 0. Re-verificado post-diseño.*

| Principio | Estado | Justificación |
|-----------|--------|---------------|
| 1. Núcleo puro y determinista | ✅ PASS | `resolveShot` es función pura; aleatoriedad entra solo por `rng: Rng` splittable. Sin `Math.random`, DOM, red ni I/O en `packages/core`. |
| 2. Local-first, sin backend | ✅ PASS | Todo en `packages/core`; sin red ni servidor. |
| 3. IA rival heurística, no LLM | ✅ N/A | Esta feature no toca la IA rival. |
| 4. Contenido es datos | ✅ PASS | Los modificadores de disparo son datos declarativos en `ShotModifierContext`; la lógica de Long Shots es una función pura sobre esos datos. |
| 5. Toda regla entra con su prueba | ✅ PASS | Contrato exige T001–T015; BDD en `.feature`; golden replay; property-based para invariantes. |

No hay violaciones. No se necesita tabla de Complexity Tracking.

---

## Project Structure

### Documentation (esta feature)

```
specs/002-remate-portero/
├── plan.md              ← este archivo
├── research.md          ← Phase 0 ✓
├── data-model.md        ← Phase 1 ✓
├── quickstart.md        ← Phase 1 ✓
├── contracts/
│   └── resolveShot.md   ← Phase 1 ✓
└── tasks.md             ← Phase 2 (/speckit-tasks)
```

### Source Code

```
packages/core/src/
├── duel/                ← sin cambios (reutilizado)
│   ├── attributeToInfluence.ts
│   ├── modifiers.ts
│   ├── uncertainty.ts
│   └── …
└── shot/                ← NUEVO módulo
    ├── types.ts         — ShotInput, ShotResult, ShotSegment, ShotEvent, ShotModifierContext, ShotMomentumCause
    ├── modifiers.ts     — applyShotModifiers(ctx): number[]
    ├── classify.ts      — classifyShot(result): ShotSegment
    ├── events.ts        — emitShotEvents(segment): ShotEvent[]
    ├── resolveShot.ts   — orquestador puro (importa de duel/ y shot/)
    ├── index.ts         — re-exports públicos
    └── __tests__/
        ├── resolveShot.test.ts          — unitarios T001, T004-T011, T014
        ├── resolveShot.property.test.ts — property-based T002, T003, T008
        ├── resolveShot.replay.test.ts   — golden replay T012
        ├── modifiers.test.ts            — T005, T006, T007, T008 unitarios de applyShotModifiers
        └── classify.test.ts             — cobertura exhaustiva de 6 tramos

packages/core/src/index.ts   — añadir re-export de shot/

tools/sim/index.ts           — añadir escenario CE-002 de remate (T013)

features/
└── 002-remate-portero.feature   — escenarios Gherkin BDD
```

**Structure Decision**: directorio `shot/` paralelo a `duel/`, mismo patrón de módulos de responsabilidad única. No se crea un tercer nivel de abstracción (no hay `duel/shared/`) porque solo hay dos consumidores y `duel/` es la fuente.

---

## Design Decisions

### D-001 — `ShotEvent` es un union separado de `DuelEvent`

No se extiende `DuelEvent` con las variantes de remate. Razones:
1. El `momentum` de remate es semántico (sin `delta`); mezclar con el `momentum{delta}` de `DuelEvent` produciría un union ambiguo.
2. Protege los tests de 001 de cambios en el union de 002.
3. Los consumidores de `ShotResult` y `DuelResult` están en capas superiores (`apps/game`); pueden importar ambos unions sin conflicto.

### D-002 — `keeper.modifiers: []` en v1

El campo existe como punto de extensión (futuro: momentum defensor, estilo, fatiga). En v1 el portero llega con `[]`. `applyDiminishing([])` devuelve 0, sin error. No se añade lógica condicional para el caso vacío.

### D-003 — `computeBand` recibe `bothSidesHaveSpecialTechnique = false`

El remate v1 no tiene técnica especial (fuera de alcance de la 002). El flag `isPenalty` de `ShotInput` es un no-op; la lógica de penalti llega en una feature futura.

### D-004 — Banda de incertidumbre heredada sin recalibrar

Se heredan `computeBand`/`sampleTriangular` con la banda 10/11/12 de ADR-0001. Se valida con harness (CE-002: tasa de gol 40-55%). Si se sale de banda, se abre ADR de remate.

---

## Complexity Tracking

No hay violaciones de constitución que justificar.
