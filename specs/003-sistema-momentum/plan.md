# Implementation Plan: Sistema de momentum (unificado)

**Branch**: `003-sistema-momentum` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-sistema-momentum/spec.md`

## Summary

Traducir dos fuentes a movimientos de una barra de momentum fraccional por equipo (§7 del manual): (1) el `DuelSegment` que ya expone `DuelResult` de 001 (tabla de duelos, 6 tramos incl. aplastante +1), y (2) los eventos significativos `cause` semántica que emite `ShotEvent` de 002 (tabla de eventos). Produce un modificador de Fuerza (`clamp(0.15 × momentum, ±0.75)`) que se inyecta como un mod situacional más en `applyDiminishing`, y detecta cruces de umbral (+3/+4/+5 y simétricos) para emitir efectos one-shot sobre la capa de cartas. El sistema es un **consumidor puro** de los resolvedores existentes: no modifica la fórmula, clasificación de tramos ni determinismo de `resolveDuel`/`resolveShot`. Como parte de esta feature se retira de `DuelEvent` (001) la variante `momentum` con delta numérico, residuo de la tabla de la §6 ya derogada — ver `research.md` #2; esto alinea 001 con el patrón de causa semántica que 002 ya usaba correctamente, sin tocar la lógica de resolución que protege RF-014. Vive en `packages/core/src/momentum/`; las tablas causa→delta viven como datos Zod en `packages/content` (primera feature que le da contenido real a ese paquete).

## Technical Context

**Language/Version**: TypeScript estricto (mismo `tsconfig` que `packages/core`).

**Primary Dependencies**: Ninguna nueva. Reutiliza `applyDiminishing` y el tipo `Rng` de `packages/core/src/duel` (ya exportados por `duel/index.ts`); `zod` para las tablas de datos en `packages/content` (ya es dependencia del monorepo, aún no usada por `packages/content`, que hoy solo tiene un `.gitkeep`).

**Storage**: N/A (estado en memoria, `packages/core` es puro; la persistencia del estado de partido es responsabilidad de `apps/game`, fuera de alcance).

**Testing**: Vitest (unit) + fast-check (property-based) + Gherkin (BDD, `.feature`), igual que 001/002.

**Target Platform**: Navegador (vía el resto del monorepo); el propio código no toca DOM/red.

**Project Type**: Librería interna (`packages/core` + `packages/content`) dentro de un monorepo pnpm.

**Performance Goals**: N/A explícito en la spec; el propio §6 exige que el pipeline siga siendo barato de simular (`pnpm sim`, miles de partidos). Sin objetivo numérico propio — hereda el de 001/002.

**Constraints**: Determinismo estricto (constitución §1, skill `core-determinism-guard`); sin `Math.random`/`Date.now`/`fetch`/DOM; toda aleatoriedad (si Determination llegara a introducirla en degradación) debe entrar por `Rng` sembrado (RF-013), aunque las reglas descritas en la spec son deterministas sin azar (la degradación y las tablas causa→delta son funciones puras sin muestreo).

**Scale/Scope**: Un `MomentumState` por equipo (2 instancias por partido). Tablas de datos: ~10 causas de evento + 5 tramos de duelo (§7). Sin UI en esta feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Evidencia |
|---|---|---|
| 1. Núcleo puro y determinista | ✅ Cumple | Toda la lógica de 003 son funciones puras `(MomentumState, evento/degradación) → MomentumState`. RF-013 exige determinismo; sin muestreo de azar (la única mención a `Rng` es defensiva, para el caso de que un rasgo futuro lo necesite — ver NEEDS CLARIFICATION #2). |
| 2. Local-first, sin backend | ✅ N/A | No toca persistencia ni red. |
| 3. IA heurística, no LLM | ✅ N/A | No es lógica de IA rival. |
| 4. Contenido es datos, no código | ✅ Cumple por diseño | RF-016/RF-017 y la petición explícita del usuario: las tablas causa→delta viven en `packages/content` como datos Zod, no como `if/else` en el motor. |
| 5. Toda regla entra con su prueba | ⏳ Pendiente de Phase 1 | `data-model.md`/`contracts/` deben dejar sitio para `.feature` + Vitest + fast-check por cada RF, como 001/002. |
| 6. Fidelidad al manual, harness | ⚠️ Riesgo a vigilar | CE-014 exige que `pnpm sim` siga preservando la jerarquía élite-medio con momentum en juego. La 003 no puede cerrarse sin una corrida de `pnpm sim` que lo confirme (fuera de alcance de `/speckit-plan`, pertenece a `implement`). |
| 9. SDD (rama, spec antes de código) | ✅ Cumple | Rama `003-sistema-momentum`, spec ya clarificada, plan generado ahora. |
| 10. Tipos y tooling | ✅ Cumple por diseño | TypeScript estricto, Biome, sin dependencias nuevas de runtime en `packages/core` (Zod ya es dependencia existente y vive en `packages/content`, no en `core`). |

**Veredicto:** PASA. No hay violaciones que requieran `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/003-sistema-momentum/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/             # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks, not this command)
```

### Source Code (repository root)

```text
packages/core/src/momentum/
├── index.ts                 # export público: applyEvent, applyDuelResult,
│                             #   computeMomentumModifier, degradeMomentum, thresholds, types
├── types.ts                 # MomentumState, MatchMomentumState, MomentumSide, ThresholdEffect,
│                             #   TraitHook (punto de extensión)
├── state.ts                 # createMomentumState, saturate/clamp a [-5,+5], actualización del máximo,
│                             #   contador de jugadas en +5
├── events.ts                 # applyEvent: traduce EventCause (de ShotEvent, 002) → delta vía
│                             #   la tabla de packages/content, suma al estado
├── duelResult.ts             # applyDuelResult: traduce DuelSegment (de DuelResult, 001) →
│                             #   delta vía la tabla de duelos (6 tramos, incl. aplastante +1) de
│                             #   packages/content, gestiona el contador de racha
├── modifier.ts                # computeMomentumModifier: clamp(0.15 × barra, ±0.75); se compone con
│                             #   applyDiminishing (importado de '../duel', no reimplementado)
├── thresholds.ts              # detectThresholdCrossing: opera sobre MatchMomentumState completo (ambos
│                             #   equipos) + qué lado se movió; emite ThresholdEffect one-shot y resuelve
│                             #   "en la zona" por los dos caminos (+5 propio, -5 rival) sin ayuda de 004
├── degradation.ts             # degradeMomentum: operación pura por posesión (llamada por 004, no por 003)
└── __tests__/
    ├── state.test.ts
    ├── events.test.ts
    ├── duelResult.test.ts
    ├── modifier.test.ts
    ├── thresholds.test.ts
    ├── degradation.test.ts
    └── *.property.test.ts   # invariantes 5/8/9/10 de la skill football-rules

packages/content/src/
├── momentum/
│   ├── eventTable.ts         # MomentumEventTableSchema (Zod) + dato: causa → delta (§7 eventos)
│   ├── duelResultTable.ts    # MomentumDuelTableSchema (Zod) + dato: tramo de duelo → delta (§7 duelos)
│   └── __tests__/
│       ├── eventTable.test.ts       # valida el dato contra el schema Zod
│       └── duelResultTable.test.ts
└── index.ts                  # export público de packages/content (primer uso real del paquete)

features/
└── 003-sistema-momentum.feature   # escenarios Gherkin de las 4 historias de usuario de la spec
```

**Structure Decision**: Módulo nuevo `packages/core/src/momentum/`, hermano de `duel/` y `shot/`, con la misma convención de `index.ts` como barrel export y `__tests__/` colocalizado. Reutiliza `applyDiminishing` y `Rng` importándolos de `../duel` (ya exportados en `duel/index.ts`), tal como pidió explícitamente el usuario — no se reimplementan. Las tablas de datos son el primer contenido real de `packages/content`, que hasta ahora estaba vacío (`.gitkeep`); esto implica crear su `package.json`/`tsconfig` mínimos en Phase 1 si aún no existen como paquete resoluble (a verificar en research: ¿content ya es un workspace package o hay que darlo de alta?).

## Complexity Tracking

*Sin violaciones de la constitución que requieran justificación.*
