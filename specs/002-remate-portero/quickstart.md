# Quickstart de validación — Remate contra el portero

**Feature**: 002-remate-portero | **Fecha**: 2026-07-08

Guía para ejecutar y verificar que la feature 002 funciona de extremo a extremo. No incluye implementación; solo comandos de validación y los resultados esperados.

---

## Prerequisitos

- `pnpm install` ejecutado.
- La feature 001 (resolvedor de duelos) está en verde: `pnpm type && pnpm check && pnpm test`.
- Rama activa: `002-remate-portero`.

---

## 1. Tests unitarios y de propiedad

```bash
pnpm test
```

**Esperado**: todos los tests de `packages/core/src/shot/__tests__/` en verde, además de los 001 que no deben romperse (regresión). La suite de purity guard (`purity.test.ts`) debe confirmar que `resolveShot` no introduce `Math.random`, `Date.now` ni accesos DOM.

Cobertura mínima requerida (ver contratos): T001–T015 según `contracts/resolveShot.md`.

---

## 2. Tipos estrictos

```bash
pnpm type
```

**Esperado**: cero errores. En particular:
- `ShotEvent` es un union discriminado separado de `DuelEvent`; no hay colisión de tipos.
- `ShotInput.keeper.modifiers: number[]` acepta `[]` sin error.
- `greatSave` y `solidSave` no aceptan `hasCorner: false` ni `roleReversal: false` (campos literalmente `true`).

---

## 3. Lint y formato

```bash
pnpm check
```

**Esperado**: cero errores Biome. Sin `Math.random`, `Date.now`, importaciones de `apps/` en `packages/core`.

---

## 4. Escenario de validación manual (smoke test)

```ts
import { makeRng } from 'packages/core/src/rng/mulberry32';
import { resolveShot } from 'packages/core/src/shot';

const rng = makeRng(42);
const result = resolveShot(
  {
    shooter: { cardPower: 4, attribute: 18, modifiers: [], composure: 16 },
    keeper:  { cardPower: 3, attribute: 10, modifiers: [], composure: 12 },
    modifierContext: {
      hasAssist: true,
      isHeaderAfterCross: false,
      hadForcedAdvance: false,
      shotZone: 'area',
      isLateralAngle: false,
      longShotsAttribute: 10,
    },
  },
  rng,
);

console.log(result.segment);  // algún tramo de gol esperado con ventaja élite
console.log(result.events);   // debe incluir { type: 'goal' } o { type: 'goalOnRebound' }
```

Ejecutar con `vite-node` u otro runner ESM:

```bash
npx vite-node <ruta-del-archivo-smoke.ts>
```

---

## 5. Harness de balance (CE-002)

```bash
pnpm sim
```

**Esperado**: el nuevo escenario de remate reporta:
- Tasa de gol (rematador élite, Finishing 18, vs portero mediocre, Reflexes 9): **entre 40% y 55%** (bloquea si cae fuera).
- Determinismo: el escenario corre dos veces con la misma semilla y produce la misma tasa.

Si la tasa se sale de la banda → investigar si hay que abrir ADR de recalibración de banda de remate (ver R-005 de `research.md`).

---

## 6. Golden replay

El test `resolveShot.replay.test.ts` guarda un snapshot de los eventos producidos por un remate con semilla fija. Tras cualquier cambio en la lógica de remate:

```bash
pnpm test -- --update-snapshots   # solo si el cambio es intencionado
```

Un golden replay roto sin cambio intencionado es una **regresión**.

---

## Referencias

- Modelo de datos: `specs/002-remate-portero/data-model.md`
- Contrato de `resolveShot`: `specs/002-remate-portero/contracts/resolveShot.md`
- Reglas del juego: skill `football-rules` (§6, tabla de remate)
- Guardia de pureza: skill `core-determinism-guard`
- ADR de banda: `specs/001-resolvedor-duelos/adr/0001-recalibrar-banda-dinamica.md`
