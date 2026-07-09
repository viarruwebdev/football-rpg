# Quickstart: validar el sistema de momentum (003)

Guía de validación end-to-end una vez implementado. No sustituye a `tasks.md` (el cómo se construye); esto es el cómo se comprueba que funciona.

## Prerrequisitos

- Rama `003-sistema-momentum` con `packages/core/src/momentum/` y `packages/content/src/momentum/` implementados según `data-model.md` y `contracts/momentum-module.md`.
- `packages/content/package.json` dado de alta (ver `research.md` #1) y `pnpm install` corrido tras crearlo.
- Paso 1 de infraestructura (redondeos fraccionales en `computeBand`/`classify`) ya mergeado en `main` — es prerrequisito declarado en `spec.md`.

## Setup

```bash
pnpm install
pnpm type   # tsc --build --force — debe estar en verde antes de tocar tests
```

## Escenarios de validación (mapeados a las 4 historias de usuario de spec.md)

### 1. El momentum fluye desde eventos y duelos (Historia 1, P1)

```bash
pnpm test packages/core/src/momentum/__tests__/events.test.ts
pnpm test packages/core/src/momentum/__tests__/duelResult.test.ts
```

**Caso de aceptación de la spec:** gol (+2 evento) seguido de 3 duelos ganados consecutivos (+0.5 cada uno) → barra a +3.5 → modificador de Fuerza `clamp(0.15 × 3.5, ±0.75) = +0.525`.

```ts
import { createMomentumState, applyEvent, applyDuelResult, computeMomentumModifier } from '@football-rpg/core';

let state = createMomentumState();
state = applyEvent(state, 'goal');                   // bar: 0 -> 2
state = applyDuelResult(state, 'cleanSuccess');      // bar: 2 -> 2.5
state = applyDuelResult(state, 'cleanSuccess');      // bar: 2.5 -> 3
state = applyDuelResult(state, 'cleanSuccess');      // bar: 3 -> 3.5
// state.bar === 3.5
// computeMomentumModifier(state.bar) === 0.525
```

### 1b. Exclusividad de tablas por tipo de duelo, no por valor del resultado (CE-009, CHK011)

```bash
pnpm test packages/core/src/momentum/__tests__/exclusivity.test.ts
```

**Caso de aceptación — mismo número, tablas distintas, efectos opuestos:**

```ts
let state = createMomentumState();

// Resultado 0 en un duelo de eslabón: balón dividido, NO mueve momentum.
state = applyDuelResult(state, 'splitBall');
// state.bar === 0 (sin cambio)

// Resultado 0 en un remate: paradón estándar, +1 al defensor.
state = applyEvent(state, 'greatSave');
// state.bar === 1
```

Este caso existe porque `DuelSegment.splitBall` y `MomentumEventCause.greatSave` corresponden ambos a un resultado numérico de 0 en sus resolvedores respectivos, pero producen efectos opuestos. `applyDuelResult`/`applyEvent` son funciones distintas con parámetros de tipos disjuntos — no hay ninguna función que reciba `result: number` y decida la tabla inspeccionando su valor (ver `contracts/momentum-module.md`, Nota A). Si alguien introdujera una función así con un `if (result === 0)`, este test la rompería inmediatamente.

### 2. Los umbrales disparan efectos visibles (Historia 2, P1)

```bash
pnpm test packages/core/src/momentum/__tests__/thresholds.test.ts
```

**Caso de aceptación:** al cruzar +4, se emite `{type:'extraCardDraw', side, amount:1}` una vez; bajar de +4 a +3 y volver a +4 sin pasar por debajo de +3 NO vuelve a dispararlo.

### 3. Degradación asimétrica (Historia 3, P2)

```bash
pnpm test packages/core/src/momentum/__tests__/degradation.test.ts
```

**Casos de aceptación:**
- Momentum +3 sin evento ni duelo ganado → tras una posesión, +2.
- Momentum −3 → tras una posesión (sin necesidad de evento), −2.
- Determination media 16+: de −2 a 0 en 1 posesión (no 2).
- La degradación nunca cruza 0 en ninguna dirección (invariante 9, football-rules).

### 4. Determinismo (Historia 4, P1)

```bash
pnpm test packages/core/src/momentum/__tests__/*.property.test.ts
```

fast-check debe confirmar: misma secuencia de eventos/posesiones ⇒ misma barra, mismo modificador, mismos efectos de umbral (CE-001).

## Puerta de calidad completa (antes de dar la feature por cerrada)

```bash
pnpm type    # sin errores
pnpm check   # biome sin fixes pendientes
pnpm test    # todos los tests verdes, incluidos los de packages/content/src/momentum
pnpm sim     # CE-014: la jerarquía élite-medio se preserva con momentum en juego
```

`pnpm sim` es el criterio más caro de falsear a mano: confirma que un jugador medio con momentum +5 (fuerza sostenida ~+1.10 según football-rules) sigue perdiendo contra un jugador élite con momentum −5 (fuerza neta ~+2.75). Si `pnpm sim` sale de banda tras integrar el modificador de momentum en el pipeline de 004 (fuera de 003, pero verificable en cuanto exista esa integración), es señal de recalibrar, no de "ajustar a ojo" (constitución, Principio 6).

## Verificación de determinismo y aislamiento (core-determinism-guard)

```bash
grep -rnE "Math\.random|Date\.now|new Date|performance\.now|fetch\(|window\.|document\.|localStorage|sessionStorage" packages/core/src/momentum \
  && echo "❌ posible no-determinismo en momentum" || echo "✅ momentum limpio"

grep -rnE "from ['\"](\.\.\/)*(apps|ui)" packages/core/src/momentum \
  && echo "❌ momentum importa de la UI" || echo "✅ dependencias correctas"
```

## Verificación de no-reimplementación (CE-005)

```bash
git diff main...003-sistema-momentum -- packages/core/src/duel/resolveDuel.ts packages/core/src/shot/resolveShot.ts
# debe salir vacío: RF-014 prohíbe tocar estos archivos

grep -rn "function applyDiminishing" packages/core/src/momentum
# debe salir vacío: applyDiminishing se importa, no se reimplementa
```

## Verificación del contrato con 001/002 (CE-007, CE-008)

```bash
grep -n "type: 'momentum'" packages/core/src/duel/events.ts && echo "❌ resolveDuel emite momentum (CE-007 roto)" || echo "✅ CE-007 OK"

test "$(grep -c "type: 'momentum'" packages/core/src/shot/events.ts)" -ge 3 \
  && echo "✅ CE-008 OK" || echo "❌ resolveShot dejó de emitir algún evento de momentum (CE-008 roto)"
```
