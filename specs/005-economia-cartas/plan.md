# Implementation Plan: Economía de cartas

**Branch**: `005-economia-cartas` | **Date**: 2026-07-10 | **Spec**: `specs/005-economia-cartas/spec.md`

**Input**: Feature specification from `specs/005-economia-cartas/spec.md`

## Summary

La 005 convierte `playMatch` en un consumidor real de cartas: tres sub-mazos por equipo (ataque 18-20, defensa 10-12, mini-mazo compartido 6-8) barajados de forma determinista, una mano única de 7, robo asimétrico (2 ofensivas / 1 defensiva + 1 compartida) al cambiar de posesión, y las tres válvulas para jugar sin carta de la fase (improvisar, reconvertir, instantes). El agotamiento sin rebarajado es la mecánica central. Vive en `packages/core/src/cards/` (motor puro) + `packages/content/src/cards/` (esquema Zod + dobles de prueba), reutiliza `resolveDuel`, `resolveShot`, `applyDiminishing` y el orquestador de la 004 sin tocar su lógica interna, y sustituye los dos stubs de `playMatch.ts` (`makeStubDuelInput`, `makeStubShotInput`) por un adaptador que traduce la carta real jugada a `DuelSide`/`ShotSide`.

## Technical Context

**Language/Version**: TypeScript estricto (mismo `tsconfig.base.json` del monorepo).

**Primary Dependencies**: Ninguna nueva. `packages/core` ya depende de `@football-rpg/content` (workspace:*, confirmado en `package.json`). Zod ya es dependencia de `packages/content`.

**Storage**: N/A — estado efímero de partido en memoria (`MatchState.cardEconomy`), sin persistencia en esta feature (Principio 8).

**Testing**: Vitest (unit), fast-check (property-based — conservación de cartas, determinismo, mano acotada), Gherkin en `features/005-*.feature` (BDD), golden replay reutilizando el runner de `playMatch.golden.test.ts` de la 004.

**Target Platform**: N/A (motor puro, sin plataforma — corre en Node/Vitest y en el navegador vía Vite, sin diferencias).

**Project Type**: Monorepo pnpm — módulo de motor puro + paquete de contenido.

**Performance Goals**: N/A explícito en la spec; el motor ya opera dentro de un `playMatch` con `MAX_POSSESSIONS = 200` y debe seguir siendo instantáneo en tests (sin async, sin I/O).

**Constraints**: Determinismo estricto (Principio 1) — Fisher-Yates sembrado, sin `Math.random`. Reutilización sin modificar `resolveDuel.ts`/`resolveShot.ts` (RF-024/RF-025, CE-012/CE-013).

**Scale/Scope**: ~3 sub-mazos × 2 equipos, mano de 7, set de portero de 5 cartas. Escala trivial — el volumen real de cartas (182 del catálogo) es la 006+.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| 1. Núcleo puro y determinista | **PASA.** `cards/` vive en `packages/core`, sin `Math.random`/`Date.now`/`fetch`/DOM. Barajado vía Fisher-Yates con `Rng.split()` (D3, research.md). Ninguna función muta argumentos. |
| 2. Local-first, sin backend | **PASA.** No se toca persistencia ni red; `CardEconomyState` es estado de partido efímero en memoria. |
| 3. IA heurística, no LLM | **N/A.** RF explícito: "La 005 expone las operaciones; el agente que decide es otra feature." No se implementa ninguna decisión de IA aquí. |
| 4. Contenido como datos | **PASA.** `CardSchema` (Zod) en `packages/content/src/cards/`, siguiendo el esqueleto de la skill `card-authoring`. El registro de efectos (`getEffect`/`registerEffect`) es el mecanismo híbrido datos+handler, vacío en v1 (D9). |
| 5. Toda regla con su prueba | **PASA (a verificar en tasks).** Cada RF entra con test unitario + al menos un property test de los invariantes de data-model.md. BDD en `features/005-*.feature` pendiente de generar en fase de tasks/implement. |
| 6. Fidelidad al manual vía harness | **PASA (a verificar con `pnpm sim`).** CE-014 exige que las bandas de la 004 (2.82 goles/partido, [2.0, 4.5]) sigan intactas con cartas reales — si no, diagnosticar antes de tocar constantes. |
| 7. Alcance vertical, anti-agotamiento | **PASA.** El "Fuera" de la spec es explícito y amplio (construcción de mazo, catálogo real, efectos individuales, sustituciones, IA) — la 005 es una rebanada vertical: cartas reales fluyendo por el motor ya existente, no todo el sistema de cartas de golpe. |
| 8. Separación run/partido | **PASA.** `CardEconomyState` es estado de partido (`MatchState.cardEconomy`), no toca estado de run. |
| 9. SDD | **PASA.** Spec clarificada antes de este plan; rama `005-economia-cartas` ya activa; `.specify/feature.json` apunta a `specs/005-economia-cartas`. |
| 10. Calidad/tooling | **PASA (a verificar en cierre).** `pnpm type`, `pnpm check`, `pnpm test` en verde antes de cerrar; sin ESLint/Prettier ni dependencias nuevas. |
| 11. Accesibilidad | **N/A.** No hay UI en esta feature (motor puro). |

**Resultado: sin violaciones.** No se requiere `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/005-economia-cartas/
├── plan.md              # este archivo
├── research.md           # decisiones D1-D10
├── data-model.md         # entidades: SubDeck, Hand, GoalkeeperSet, CardEconomyState, PlayedCard, Instant
├── quickstart.md          # escenarios de validación end-to-end
├── contracts/
│   └── cards-module.md    # contrato de módulo core/cards ↔ match
└── tasks.md               # Phase 2 output (/speckit-tasks, no generado aquí)
```

### Source Code (repository root)

```text
packages/
├── core/
│   └── src/
│       ├── cards/                      # NUEVO — motor puro de economía de cartas
│       │   ├── index.ts                # barrel (contrato de contracts/cards-module.md)
│       │   ├── types.ts                # SubDeck, Hand, GoalkeeperSet, CardEconomyState, PlayedCard, Instant
│       │   ├── shuffle.ts              # Fisher-Yates determinista (D3)
│       │   ├── deck.ts                 # createCardEconomyState, assertDeckFloor (D7), drawOnPossessionChange
│       │   ├── hand.ts                 # discardToLimit, mulligan
│       │   ├── play.ts                 # playCard, improviseCard, convertCard
│       │   ├── adapter.ts              # cardToDuelSide, cardToShotSide (D5)
│       │   ├── retreat.ts              # applyRetreat
│       │   ├── goalkeeper.ts           # regenerateGoalkeeperSet, useGoalkeeperCard (D10)
│       │   ├── crushingDraw.ts         # drawOnCrushingSuccess (RF-012/CE-011)
│       │   ├── effects/
│       │   │   └── registry.ts         # registerEffect/getEffect, vacío en v1 (D9)
│       │   └── __tests__/
│       │       ├── shuffle.test.ts
│       │       ├── deck.test.ts
│       │       ├── hand.test.ts
│       │       ├── play.test.ts
│       │       ├── adapter.test.ts
│       │       ├── retreat.test.ts
│       │       ├── goalkeeper.test.ts
│       │       ├── conservation.test.ts   # property tests CE-002/CE-005
│       │       └── notYetImplemented.test.ts  # D9 pinning test
│       └── match/
│           ├── types.ts                # + campo cardEconomy?: CardEconomyState (D4)
│           └── playMatch.ts            # sustituye makeStubDuelInput/makeStubShotInput por el adaptador (D5/D6)
└── content/
    └── src/
        └── cards/                       # NUEVO — datos + esquema
            ├── schema.ts                # CardSchema (Zod), sigue skill card-authoring
            ├── testFixtures.ts          # dobles de prueba Zod-válidos (D8), NO el catálogo real
            └── __tests__/
                └── schema.test.ts

features/
└── 005-economia-cartas.feature          # BDD, criterios de aceptación (Historias 1-4)
```

**Structure Decision**: dos módulos nuevos siguiendo el patrón ya establecido por `duel/`, `shot/`, `momentum/` en `packages/core` (lógica pura, barrel `index.ts`, `__tests__/` co-ubicado) y por `packages/content/src/momentum/` en `packages/content` (datos + Zod). `match/playMatch.ts` y `match/types.ts` se modifican mínimamente: un campo opcional nuevo y la sustitución de dos funciones de construcción de input que ya eran stubs deliberados. Ningún resolvedor (`resolveDuel.ts`, `resolveShot.ts`) se toca.

## Complexity Tracking

*Sin violaciones de la Constitution Check — tabla vacía, no aplica.*
