# Research: Sistema de momentum (003)

## 1. `packages/content` no tiene `package.json` propio

**Decision:** crear `packages/content/package.json` mínimo (siguiendo el patrón exacto de `packages/core/package.json`: `name: "@football-rpg/content"`, `private: true`, `type: module`, `main`/`types` apuntando a `./src/index.ts`, sin `dependencies` propias porque `zod` vive en la raíz del monorepo y `packages/content` la resuelve por hoisting de pnpm workspaces). Se añade como tarea de Setup en `tasks.md` (fase 2, fuera de este plan).

**Rationale:** `pnpm-workspace.yaml` ya incluye `packages/*` y `tsconfig.json` raíz ya referencia `./packages/content`, así que el paquete está "dado de alta" a nivel de build TS pero no a nivel de pnpm workspace (pnpm necesita `package.json` con `name` para resolver `@football-rpg/content` como dependencia de otros paquetes, aunque en v1 nada importa aún de `content` — 003 es quien empieza a poblarlo). Sin este archivo, `pnpm install` no lo reconoce como paquete instalable y cualquier futuro `import` cruzado fallaría.

**Alternatives considered:**
- Meter las tablas de datos directamente en `packages/core/src/momentum/` como constantes TS en vez de Zod: rechazado, viola el Principio 4 de la constitución ("el contenido es datos, no código") y la instrucción explícita del usuario.
- Esperar a otra feature para dar de alta `content`: rechazado, la propia 003 es quien necesita el paquete ahora; no tiene sentido bloquearse en un `package.json` de 10 líneas.

## 2. `DuelEvent.momentum` eliminado — la tabla de duelos de la §7 (6 tramos) cubre todo el eslabón

**Hallazgo original (sesión previa, descartado tras revisión):** se detectó que `DuelEvent.momentum` traía `delta` numérico ya resuelto (`crushingSuccess` +1, `disadvantagedLoss` +1, `devastatingCounter` +2), mientras `ShotEvent.momentum` traía `cause` semántica sin delta. La primera hipótesis fue tolerar ambos shapes en el consumidor. **Esa hipótesis se rechazó**: los tres eventos de `DuelEvent.momentum` eran residuo de una columna de momentum de la §6 ya derogada, y aceptarlos habría introducido deltas obsoletos (mezclando la vieja tabla de la §6 con la vigente de la §7).

**Verificación contra la §7 vigente (manual, `7 Momentum y Energía.md`):** su tabla de eventos ("Eventos significativos") tiene exactamente 9 filas: marcar gol, encajar gol, gol contra la marea, técnica especial, parada épica, mano a mano, pressing, racha de posesión, paradón estándar — cubiertas por 8 identificadores de `MomentumEventCause` (`goal` cubre marcar/encajar vía `side`; ver `data-model.md`). **Ninguna fila corresponde a un resultado de duelo de eslabón** ("aplastante ganado/perdido" no está ahí — es un error que se coló en una versión anterior de la skill `football-rules`, ya corregido). En cambio, la tabla de duelos tiene **7 tramos**, no 6 (el avance forzado tiene su propia fila, delta 0, no colapsado bajo "ganado"):

| Resultado del duelo | Delta |
|---|---|
| Éxito limpio (+3..+5) — "duelo ganado" | +0.5 |
| Avance forzado (+1..+2) | No mueve, no incrementa consecutivos |
| Balón dividido (0) | No mueve |
| Perder duelo (−1 o peor) | −1, resetea contador |
| Pérdida con desventaja (−3..−5) | −1.5 |
| Contragolpe devastador (−6) | −2 |
| Éxito aplastante ganado (+6 o más) | **+1** |

El aplastante (+6) **sustituye** el +0.5 genérico por +1 dentro de la misma tabla de duelos — no es un evento aparte que se sume. "Un resultado de +6 dispara SOLO la tabla de duelos (+1)" (cita literal del manual). La asimetría ganar/perder es un ratio 2:1 constante en toda la tabla.

**Decision:** `resolveDuel`/`events.ts` deja de emitir eventos de tipo `momentum` por completo. Se eliminó la variante `{type:'momentum'; side; delta}` de `DuelEvent` (`packages/core/src/duel/types.ts`). Todo el momentum derivado de duelos de eslabón (los 6 tramos, incluido el aplastante) lo deriva 003 directamente del `DuelSegment` que ya emite `resolveDuel` en su resultado (`DuelResult.segment`), vía `applyDuelResult(state, segment)` y la tabla `DuelMomentumTable` de `packages/content` — sin pasar por ningún evento intermedio. `resolveShot`/`ShotEvent.momentum` no se toca: es la excepción documentada en la §7 (remate = evento, no tabla de duelos), y ya emitía `cause` semántica correctamente desde 002.

`applyEvent` acepta una única forma de entrada: `cause: MomentumEventCause`. No hay unión discriminada `{cause} | {delta}` — no hay dos shapes que reconciliar, hay un shape correcto (el de 002) y un evento que sobraba (el de 001). Además, `applyEvent` y `applyDuelResult` son funciones distintas con parámetros de tipos disjuntos (`MomentumEventCause` vs `DuelSegment`, ver `contracts/momentum-module.md` Nota A) — la exclusividad entre la tabla de eventos y la de duelos es un contrato de tipos, no una inspección del valor del resultado (CHK011, checklist `momentum-rules.md`).

**Cambios de código resultantes (fuera de `packages/core/src/momentum/`, en 001 ya mergeado):**
- `packages/core/src/duel/types.ts` — `DuelEvent` pierde la variante `momentum`.
- `packages/core/src/duel/events.ts` — `EVENTS_BY_SEGMENT` deja de incluir `{type:'momentum', ...}` en `crushingSuccess`, `disadvantagedLoss`, `devastatingCounter`.
- `packages/core/src/duel/__tests__/events.test.ts` — los 3 casos afectados verifican la lista de eventos sin el momentum.
- `packages/core/src/duel/__tests__/resolveDuel.feature.test.ts` + `features/001-resolvedor-duelos.feature` — el escenario "un éxito aplastante emite el evento de momentum" se reescribió a "no emite evento de tipo momentum".
- `packages/core/src/duel/__tests__/__snapshots__/replay.test.ts.snap` — 9 golden replays actualizados (solo se eliminan los objetos `{type:'momentum',...}`; `result` y `segment` no cambian, confirmado por diff).

**Rationale:** RF-014 protege la lógica de resolución (fórmula, clasificación de tramos, determinismo) — no la forma del evento emitido. Cambiar qué eventos emite `events.ts` sin tocar `classify.ts`, `resolveDuel.ts` (fórmula) ni el muestreo de incertidumbre no es "modificar resolveDuel" en el sentido que RF-014 prohíbe; es alinear la forma del evento con el patrón que 002 ya estableció correctamente. Mantener los 3 eventos fósiles habría obligado a 003 a aplicar dos tablas distintas y potencialmente contradictorias (§6 derogada vía evento, §7 vigente vía segmento) al mismo resultado de duelo.

**Alternatives considered:**
- Tolerar ambos shapes en el consumidor (hipótesis original): rechazada — perpetúa deltas de una tabla derogada y arriesga doble contabilidad real (no la doble contabilidad legítima de "evento + duelo" que sí prevé RF-002, sino literalmente el mismo concepto contado dos veces con números de dos épocas distintas del manual).
- Mapear los 3 eventos fósiles a causas semánticas de la §7 vigente: rechazada — la §7 no tiene causas de evento equivalentes a "aplastante"/"desventaja" en duelos de eslabón; forzar un mapeo habría sido inventar contenido no presente en la fuente de verdad.
- Dejar `disadvantagedLoss`/`devastatingCounter` sin emitir nada y solo corregir `crushingSuccess`: rechazada — los 3 son el mismo problema (fósiles de la §6 derogada); una corrección parcial habría dejado el código en un estado intermedio inconsistente sin razón.

## 3. Tipo `Rng` — ¿lo necesita 003 en v1?

**Decision:** el tipo `Rng` se acepta como parámetro opcional/punto de extensión en las firmas que la spec marca como potencialmente afectadas por Determination (RF-013: "cualquier aleatoriedad... entra por el Rng sembrado"), pero **ninguna regla descrita en la spec usa muestreo aleatorio hoy**. Las tablas causa→delta son deterministas puras; la degradación es aritmética pura (comparación de Determination media contra un umbral fijo, no un sorteo). Se importa el tipo `Rng` de `../duel` (ya exportado) para la firma de `degradeMomentum`, dejando el parámetro sin usar internamente en v1 — es el punto de extensión que RF-017 pide para rasgos futuros, no una necesidad actual.

**Rationale:** cumple la petición explícita del usuario ("Reutiliza applyDiminishing y el union de eventos de 001 [...] Cargar skills football-rules y core-determinism-guard") sin inventar aleatoriedad donde el manual no la pide. Mantiene el punto de extensión abierto sin sobre-diseñar.

**Alternatives considered:**
- Omitir `Rng` de las firmas hasta que un rasgo lo necesite: rechazado — cambiar la firma pública de `degradeMomentum` más adelante (cuando 004 ya la esté llamando) sería un breaking change evitable; es más barato reservar el parámetro ahora, documentado como punto de extensión, tal como pide RF-017 para los rasgos.
