# Implementation Plan: Cadena de posesión y reloj de partido

**Branch**: `004-cadena-posesion` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-cadena-posesion/spec.md`

## Summary

El orquestador de partido: secuencia duelos llamando a `resolveDuel`/`resolveShot`, mantiene el reloj compartido de jugadas (30+30+descuento), gestiona la presión acumulada y la franja/carril de la posesión actual, invierte roles al robar el balón, y **cablea el modificador de momentum** (`computeMomentumModifier` → `applyDiminishing`) al array de mods de `resolveDuel`. Traduce cada `DuelSegment` a momentum vía `applyDuelResult` y cada `ShotEvent` de gol/paradón vía `applyEvent`, dispara `degradeAndDetect` al cerrar cada posesión, y emite las tres causas de momentum que solo el orquestador puede conocer por requerir contexto de posesión: `possessionStreak` (3+ duelos ganados), `pressingSteal` (robo en franja avanzada del atacante) y la degradación por posesión.

Es un **consumidor puro** de 001/002/003: no reimplementa ni modifica ningún resolvedor. La única ampliación de superficie pública requerida en código existente es un reset de `consecutiveWins` por fin de posesión en `packages/core/src/momentum/` (RF-009c), que la 003 no necesitaba porque no conocía el concepto de posesión. Vive en `packages/core/src/match/`, nuevo módulo hermano de `duel/`, `shot/` y `momentum/`.

## Technical Context

**Language/Version**: TypeScript estricto (mismo `tsconfig` que el resto de `packages/core`).

**Primary Dependencies**: Ninguna nueva. Reutiliza de `packages/core`: `resolveDuel`, `DuelInput`, `DuelResult`, `DuelSegment` (`../duel`); `resolveShot`, `ShotInput`, `ShotResult`, `ShotEvent` (`../shot`); `applyDuelResult`, `applyEvent`, `computeMomentumModifier`, `degradeAndDetect`, `createMatchMomentumState`, `MatchMomentumState`, `MomentumSide`, `DegradationContext`, `shotSegmentToMomentumCause` (`../momentum`); `applyDiminishing` (`../duel/modifiers`, ya exportado); `Rng` (`../rng/types`). `zod` para el único dato nuevo de contenido (tabla de consumo de reloj), si se decide en Phase 1 que vive en `packages/content` en vez de como constante de `packages/core` — a resolver en research (ver NEEDS CLARIFICATION #1).

**Storage**: N/A (estado en memoria; `packages/core` es puro; persistencia de partido es responsabilidad de `apps/game`, fuera de alcance).

**Testing**: Vitest (unit) + fast-check (property-based, incl. CE-015 reloj monótono/phase ordenada) + Gherkin (`features/004-cadena-posesion.feature`, ya escrito) + golden replay de un partido completo sembrado (CE-001), siguiendo el patrón de 001/002/003.

**Target Platform**: Navegador (vía el resto del monorepo); el propio código no toca DOM/red.

**Project Type**: Librería interna (`packages/core`) dentro de un monorepo pnpm.

**Performance Goals**: Sin objetivo numérico propio explícito en la spec. Debe seguir siendo barato de correr en `pnpm sim` (miles de partidos completos, no solo duelos aislados) — más exigente que 001/002/003 porque cada partido simulado ahora ejecuta ~60-70 duelos encadenados en vez de uno solo.

**Constraints**: Determinismo estricto (constitución §1, skill `core-determinism-guard`). El `Rng` del partido se **divide con `.split()` una vez por duelo** (RF-015, instrucción explícita del usuario) antes de pasarlo a `resolveDuel`/`resolveShot`, nunca reutilizado ni con `.next()` directo sobre el `Rng` del partido. Ningún resolvedor (`resolveDuel.ts`, `resolveShot.ts`) se modifica (CE-010, verificable con `git diff`).

**Scale/Scope**: Un `MatchState` por partido simulado (reloj + posesión + `MatchMomentumState` + marcador + `Rng`). Sin UI en esta feature. ~60-70 duelos por partido en el caso típico (60 jugadas + descuento 4-8, sin contar balón dividido/robos que no consumen jugada adicional de reloj más allá de lo ya tabulado).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Evidencia |
|---|---|---|
| 1. Núcleo puro y determinista | ✅ Cumple por diseño | RF-015/RF-016; toda la orquestación es `(MatchState, Rng) → { state, events }`. El `Rng` se divide por duelo (instrucción explícita del usuario), nunca mutado ni global. |
| 2. Local-first, sin backend | ✅ N/A | No toca persistencia ni red. |
| 3. IA heurística, no LLM | ✅ N/A | No decide jugadas de IA; recibe la carta/jugador/destino como entrada (fuera de alcance, ver Suposiciones de la spec). |
| 4. Contenido es datos, no código | ⏳ A resolver en Phase 0 | La tabla de consumo de jugadas (§2) es un dato pequeño y estable (8 entradas). NEEDS CLARIFICATION #1: ¿vive como constante tipada en `packages/core/src/match/` (como `EVENTS_BY_SEGMENT` en `duel/events.ts`, que es código-como-tabla pero no contenido balanceable) o como dato Zod en `packages/content` (como las tablas de momentum de la 003)? Los RF no la marcan como balanceable por el diseñador; probable que constante interna baste. |
| 5. Toda regla entra con su prueba | ⏳ Pendiente de Phase 1 | `data-model.md`/`contracts/` deben cubrir cada RF con Vitest + fast-check (donde aplique) + el `.feature` ya existente. |
| 6. Fidelidad al manual, harness | ⚠️ Riesgo a vigilar | CE-006/CE-007/CE-008 exigen que `pnpm sim` corra partidos completos y preserve las bandas de 001/002 más la nueva banda provisional [2.0, 4.5] goles/partido. Es la primera feature que ejercita el harness sobre partidos completos, no duelos aislados — riesgo de rendimiento y de desvíos de calibración que requieran ADR-0003 (spec CE-008). |
| 7. Alcance vertical | ✅ Cumple | La spec declara explícitamente "una posesión completa jugable de extremo a extremo", con 7 puntos fuera de alcance (cartas, pool, prórroga, faltas/lesiones, córner/penalti, mini-duelo) dejados como puntos de extensión (RF-019, RF-020). |
| 8. Separación run/partido | ✅ N/A | `MatchState` es íntegramente estado de partido (efímero); no toca estado de run. |
| 9. SDD (rama, spec antes de código) | ✅ Cumple | Rama `004-cadena-posesion`, spec clarificada (4 preguntas resueltas 2026-07-10), `.feature` ya escrito, plan generado ahora. |
| 10. Tipos y tooling | ✅ Cumple por diseño | TypeScript estricto, Biome, sin dependencias nuevas de runtime en `packages/core`. |

**Veredicto:** PASA. Un punto (#4, ubicación de la tabla de reloj) queda para Phase 0 research; no es una violación, es una decisión de diseño menor sin impacto en los gates.

## Project Structure

### Documentation (this feature)

```text
specs/004-cadena-posesion/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/             # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks, not this command)
```

### Source Code (repository root)

```text
packages/core/src/match/
├── index.ts                  # export público: playMatch, tipos MatchState/MatchClock/
│                              #   PossessionState/PossessionTransition/MatchEvent
├── types.ts                  # MatchState, MatchClock (phase: 'firstHalf'|'secondHalf'|'stoppage'),
│                              #   PossessionState, PossessionTransition (discriminated union,
│                              #   RF-020), MatchEvent, HalftimeAction (punto de extensión, sin
│                              #   lógica en v1)
├── clock.ts                  # tabla de consumo de jugadas (§2, RF-002); advanceClock,
│                              #   computeStoppageTime (RF-003/RF-004, descuento semioculto
│                              #   derivado de eventos, revelado a 2 jugadas restantes);
│                              #   invariante: phase solo avanza firstHalf→secondHalf→stoppage
├── possession.ts              # createPossession, closePossession, applyTransition (aplica
│                              #   PossessionTransition al estado: avance de franja/carril,
│                              #   presión +1 por eslabón — RF-006); resetConsecutiveWins al
│                              #   cerrar posesión (RF-009c)
├── transition.ts              # DuelSegment → PossessionTransition (tabla interna, RF-020,
│                              #   verificada contra §6 en la spec)
├── momentumWiring.ts          # cablea computeMomentumModifier(bar) al array de mods que recibe
│                              #   resolveDuel (RF-007); llama a applyDuelResult/applyEvent tras
│                              #   cada duelo/remate (RF-008); emite possessionStreak (RF-009) y
│                              #   pressingSteal (RF-009b) — únicas causas de momentum que solo
│                              #   el orquestador puede emitir por depender de contexto de posesión
├── endgame.ts                 # reloj a 0: completar duelo en curso (RF-012); "último suspiro"
│                              #   (RF-013, exactamente 1 duelo extra si el atacante pierde)
├── playMatch.ts               # función pública: orquesta la secuencia completa de un partido,
│                              #   divide el Rng con .split() una vez por duelo (RF-015),
│                              #   devuelve { state: MatchState, events: MatchEvent[] }
└── __tests__/
    ├── clock.test.ts
    ├── clock.property.test.ts    # CE-015: reloj monótono, phase solo avanza en orden
    ├── possession.test.ts
    ├── transition.test.ts        # CE-014 pressingSteal no invertido (dos casos simétricos),
    │                              #   RF-020 verificado contra §6 tramo por tramo
    ├── momentumWiring.test.ts    # CE-005 composición momentum→mods, CE-012 racha one-shot,
    │                              #   CE-013 reset por fin de posesión
    ├── endgame.test.ts
    └── playMatch.golden.test.ts  # CE-001: golden replay, mismo seed → mismo log/marcador

packages/core/src/momentum/
└── updateMomentum.ts          # AMPLIACIÓN (no reescritura): nueva operación de reset de
                                #  consecutiveWins por fin de posesión (RF-009c), invocable desde
                                #  004. applyEvent/applyDuelResult/detectThresholdCrossing/
                                #  applyThresholdEffects NO se tocan (solo superficie añadida)

tools/sim/
└── (ampliación futura, fuera de plan.md: partidos completos vía playMatch para CE-006/007/008;
    se detalla en tasks.md si aplica a esta feature o se difiere)

features/
└── 004-cadena-posesion.feature   # ya existe; criterios de aceptación BDD de esta spec
```

**Structure Decision**: Módulo nuevo `packages/core/src/match/`, hermano de `duel/`, `shot/` y `momentum/`, con la misma convención de `index.ts` como barrel export y `__tests__/` colocalizado que 001/002/003. La única modificación a código existente es una ampliación de superficie en `packages/core/src/momentum/` (RF-009c) — no se reescribe lógica ya cerrada por la 003. `resolveDuel.ts` y `resolveShot.ts` permanecen sin diff (CE-010). El `Rng` de nivel partido vive en `MatchState` y se divide con `.split()` exactamente una vez por duelo/remate antes de invocar los resolvedores, nunca compartido entre ellos.

## Complexity Tracking

*Sin violaciones de la constitución que requieran justificación. El único punto abierto (ubicación de la tabla de consumo de jugadas: constante vs. `packages/content`) se resuelve en Phase 0 research, no es una violación de gate.*
