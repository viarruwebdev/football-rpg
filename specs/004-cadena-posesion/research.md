# Research — Cadena de posesión y reloj de partido

**Feature**: 004-cadena-posesion | **Fecha**: 2026-07-10

Una única incógnita abierta por el Constitution Check (Principio 4). El resto del diseño está fijado por la spec clarificada, las firmas ya existentes de 001/002/003, y las instrucciones explícitas del usuario para esta feature (módulo, reutilización, `Rng.split()` por duelo).

---

## R-001 — Ubicación de la tabla de consumo de jugadas (§2)

**Pregunta**: ¿la tabla de consumo de reloj (duelo 1, balón dividido +1, córner 2, penalti 2, sustitución 1, cambio de carril 1, pase de seguridad 1, posesión estéril 2, remate 1 — RF-002) vive como constante tipada dentro de `packages/core/src/match/clock.ts`, o como dato Zod en `packages/content`?

**Decisión**: constante tipada (`Record<TimeConsumingAction, number>`) dentro de `packages/core/src/match/clock.ts`, siguiendo el precedente de `EVENTS_BY_SEGMENT` en `packages/core/src/duel/events.ts`.

**Razonamiento**:
- La constitución (Principio 4) exige que el **contenido balanceable** — cartas, formaciones, estilos, roles, perfiles de IA — viva en `packages/content` como datos Zod. La tabla de consumo de jugadas no es contenido de diseño de juego editable por el autor entre partidas: es una regla estructural del reloj, fija por el manual §2, del mismo tipo que `EVENTS_BY_SEGMENT` (qué eventos dispara cada tramo de duelo) o `WINNING_SEGMENTS`/`LOSING_SEGMENTS` en `momentum/duelResult.ts` — ambas ya viven como constantes en `packages/core`, no en `packages/content`.
- Precedente directo: las tablas de momentum de la 003 (`momentumEventTable`, `momentumDuelResultTable`) sí viven en `packages/content` porque son **valores de balance** (deltas de momentum) que el diseñador puede querer ajustar sin tocar lógica. La tabla de consumo de reloj no tiene esa propiedad: son enteros fijos del reglamento (1 jugada por duelo, 2 por córner…), no un parámetro de balance del juego.
- Mantenerla como constante evita crear una segunda superficie Zod para 8 números que no van a cambiar por iteración de balance, y no añade una dependencia de `packages/content` a un módulo que de otro modo no la necesita.

**Alternativa descartada**: dato Zod en `packages/content/src/match/clockTable.ts`. Válida pero desproporcionada para este caso — se reconsiderará si en el futuro el diseñador pide ajustar el consumo de reloj como palanca de balance (movería la constante a `packages/content` sin tocar la lógica de `clock.ts`, cambio de bajo riesgo).

---

## R-002 — Forma del reset de `consecutiveWins` por fin de posesión (RF-009c)

**Pregunta**: la spec exige ampliar la superficie pública de `packages/core/src/momentum/` con una operación de reset por fin de posesión, sin tocar `applyEvent`, `applyDuelResult`, `detectThresholdCrossing` ni `applyThresholdEffects`. ¿Qué forma toma exactamente?

**Decisión**: nueva función `resetConsecutiveWins(state: MomentumState): MomentumState` en `momentum/state.ts` (junto a `saturate`/`updateDerived`, que ya son las utilidades puras de transformación de `MomentumState`), exportada desde `momentum/index.ts`. El orquestador de la 004 la invoca directamente al cerrar una posesión — no se integra dentro de `degradeAndDetect`, porque el reset de contador y la degradación de barra son dos operaciones independientes que pueden no coincidir en el mismo instante (RF-009c resetea siempre al cerrar posesión; RF-010/`degradeAndDetect` solo degrada la barra bajo condición). Fusionarlas obligaría a `degradeAndDetect` a asumir que "cerrar posesión" y "degradar" son el mismo evento, lo cual no es cierto por diseño (ver spec: la degradación es condicional, el reset no lo es).

**Razonamiento**:
- Sigue el patrón existente: `degradeMomentum` en `degradation.ts` ya es una función pura `(MomentumState, context) → MomentumState` que el orquestador de la 004 invoca vía `degradeAndDetect`. `resetConsecutiveWins` es del mismo tipo de operación (transformación pura de `MomentumState`) y encaja en `state.ts`, donde ya vive el resto de utilidades de bajo nivel del estado (`saturate`, `updateDerived`).
- No amplía ninguna de las cuatro funciones que la spec protege explícitamente (`applyEvent`, `applyDuelResult`, `detectThresholdCrossing`, `applyThresholdEffects`): es una función nueva y aislada, no una modificación de las existentes.
- Mantiene la 004 como orquestador: decide *cuándo* llamar a `resetConsecutiveWins` (siempre al cerrar posesión) y *cuándo* a `degradeAndDetect` (también al cerrar posesión, pero con su propia condición interna) como dos pasos separados y explícitos en `possession.ts::closePossession`, en vez de acoplarlos en un solo efecto oculto dentro de `momentum/`.

**Alternativa descartada**: incluir el reset dentro de `degradeAndDetect`. Descartada porque acopla dos conceptos independientes (condición de degradación vs. incondicionalidad del reset) y porque la propia spec (RF-009c) los presenta como dos operaciones distintas ("además del reset por perder un duelo que ya implementa la 003"), no como una fusión.

---

## R-003 — Cómo se compone el array de mods de `resolveDuel` con presión + momentum

**Pregunta**: RF-006 y RF-007 exigen que tanto la presión acumulada como el modificador de momentum entren en el mismo array `modifiers: number[]` de `DuelSide` (ver `packages/core/src/duel/types.ts`), junto a estilo/rol/química (fuera de alcance de esta feature, aún no implementados). ¿Cómo construye el orquestador ese array sin que la 004 necesite conocer los mods de estilo/rol/química que otras features añadirán después?

**Decisión**: `momentumWiring.ts` expone una función `buildSituationalModifiers(pressure: number, momentumBar: number, extraModifiers: number[] = []): number[]` que devuelve `[pressure, computeMomentumModifier(momentumBar), ...extraModifiers]`. El orquestador la invoca con `extraModifiers: []` en v1 (estilo/rol/química no existen todavía como datos). El parámetro queda como punto de extensión explícito para cuando esas features lleguen, sin cambiar la firma de `resolveDuel` ni de `applyDiminishing` (ambas ya aceptan `number[]` sin más estructura).

**Razonamiento**:
- `applyDiminishing` (`duel/modifiers.ts`) ya opera sobre `number[]` sin distinguir la fuente de cada modificador — es agnóstica por diseño. No hace falta ninguna extensión de tipo para componer presión + momentum en el mismo array.
- Mantiene el orden implícito del §6 (presión, momentum y el resto son todos "modificadores situacionales" indistintos una vez dentro del array) sin inventar una jerarquía que el manual no pide.

**Alternativa descartada**: un tipo `SituationalModifierSources` que etiquete cada mod por origen (`{ source: 'pressure' | 'momentum' | 'style', value: number }`). Descartada por sobre-ingeniería: ningún RF de la 004 pide poder distinguir el origen de un mod después de sumarse — `applyDiminishing` los trata igual, y la trazabilidad de "de dónde vino cada mod" no la pide ningún CE.
