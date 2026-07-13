# Research — Economía de cartas (spec 005)

**Fecha:** 2026-07-10
**Spec:** `specs/005-economia-cartas/spec.md`

No hay `NEEDS CLARIFICATION` pendientes: la spec quedó clarificada (sesión 2026-07-10, `/speckit.clarify`) contra doc/§2, §3, §4. Este documento resuelve las decisiones técnicas necesarias para pasar de "qué" a "cómo", apoyándose en el código real de `packages/core` y `packages/content` inspeccionado en esta sesión.

## D1 — Ubicación del módulo

**Decisión:** `packages/core/src/cards/` (motor: barajado, mano, robo, mulligan, repliegue, improvisar/reconvertir, set del portero) + `packages/content/src/cards/` (esquema Zod + dobles de prueba).

**Justificación:** sigue el patrón exacto de `momentum/` y `duel/`: lógica pura en `core`, datos validados en `content`. `packages/core/package.json` ya declara `"@football-rpg/content": "workspace:*"` como dependencia — la integración de import ya existe, no hay que añadir nada a `DEPENDENCIAS.md`.

**Alternativas consideradas:** meter el barajado dentro de `match/` (rechazado: la economía de cartas es una responsabilidad propia, igual que `duel` y `momentum` son módulos separados que `match` orquesta, no contiene).

## D2 — Qué se reutiliza y qué se sustituye

**Decisión:**
- `resolveDuel`, `resolveShot`, `applyDiminishing` (`duel/modifiers.ts`), `updateMomentum`/`applyDuelResult`/`applyEvent` (momentum), y el orquestador `playMatch` (`match/playMatch.ts`) se **reutilizan sin modificar su lógica interna** (RF-024, RF-025).
- Se **sustituyen** dos funciones locales de `playMatch.ts`: `makeStubDuelInput` y `makeStubShotInput`. Hoy construyen `DuelInput`/`ShotInput` con perfiles fijos (`DEFAULT_PROFILE`, `attackProfile`/`defenseProfile` desde `state.teamProfiles`) y arrays de `modifiers` vacíos o solo con presión+momentum. La 005 sustituye el origen de `cardPower` (hoy `attackProfile.cardPower` fijo) por la potencia de la carta real jugada desde la mano, y añade el mod de repliegue al array de `modifiers` cuando esté activo.
- `DuelInput.attack.modifiers` / `defense.modifiers` ya es `number[]` — el repliegue (+2) se añade a ese array exactamente igual que hace hoy `buildSituationalModifiers` con `pressure` y `computeMomentumModifier(bar)`. No hace falta cambiar la forma del tipo.

**Verificación de "no reimplementar" (CE-012):** un test de grep en CI (o en `__tests__`) que falle si `packages/core/src/cards/` contiene código estructuralmente equivalente a `resolveDuel`/`resolveShot`/`applyDiminishing` (p. ej. buscar `triangular`, `computeBand`, umbral -6/+6 hardcodeado). Test negativo, ver `contracts/`.

**Verificación de "resolvedores intactos" (CE-013):** `git diff <base>...HEAD -- packages/core/src/duel/resolveDuel.ts packages/core/src/shot/resolveShot.ts` debe estar vacío. Se documenta como paso de CI/checklist, no como test de Vitest (no hay forma de testear un diff de git dentro de Vitest sin acceso a git, que sería I/O no determinista — no entra en `packages/core`). Vive como comprobación de tarea/CI fuera del motor.

**Alternativas consideradas:** envolver `resolveDuel`/`resolveShot` en un adaptador dentro de `cards/` que traduzca `PlayedCard → DuelInput`. Aceptado como parte del diseño (ver D5) — no es reimplementación, es construcción del input, que ya era responsabilidad de `playMatch.ts` (las funciones stub que sustituimos).

## D3 — Modelo de aleatoriedad para el barajado

**Decisión:** Fisher-Yates con el propio `Rng` recibido, dividido con `.split()` **una vez por sub-mazo** al construir el `CardEconomyState` inicial (4 barajados por equipo: ataque, defensa, compartido, y ninguno para el set del portero que no se baraja — se regenera completo, no es una secuencia). El `Rng` resultante de cada split se consume linealmente por el algoritmo de Fisher-Yates (mismo generador para todos los swaps de ese barajado, sin split adicional por swap — evita agotar el árbol de splits para una operación que ya es una sola pasada determinista).

**Justificación:** sigue el patrón D1 de la 004 (un `.split()` por "unidad lógica" — allí un duelo, aquí un barajado). Fisher-Yates es el algoritmo estándar de barajado sin sesgo; con un PRNG sembrado y determinista da la misma permutación para la misma semilla (RF-003, CE-001).

**Alternativas consideradas:** un split por cada swap del Fisher-Yates (rechazado: coste de splits innecesario para una operación estructuralmente secuencial, ninguna otra parte del motor necesita "ramificar" en medio de un barajado).

## D4 — Forma del estado: `CardEconomyState`

**Decisión:** vive junto a `MatchState` en `match/types.ts` como un campo nuevo `cardEconomy?: CardEconomyState` (opcional, igual patrón que `teamProfiles?` — así los tests existentes de `playMatch` que no configuran cartas siguen funcionando con un fallback determinista, ver D6). La 005 define el tipo en `cards/types.ts` y lo importa desde `match/types.ts`, no al revés (evita ciclo: `cards` es una capa por debajo de `match`, igual que `duel`/`momentum`/`shot`).

**Justificación:** coherente con Principio 8 (estado de partido, efímero) — `CardEconomyState` vive y muere con el partido, igual que `momentum`, `possession` y `clock`.

## D5 — Adaptador `PlayedCard → DuelInput/ShotInput`

**Decisión:** una función pura `cardToDuelSide(card: PlayedCard, attribute: number, composure: number, extraModifiers: number[]): DuelSide` (y su equivalente `cardToShotSide`) en `cards/adapter.ts`. Traduce la potencia efectiva de la carta (según sea `natural`/`converted`/`improvised`, RF-016/RF-017) a `cardPower`, y compone `modifiers` igual que hoy hace `buildSituationalModifiers` (presión + momentum + repliegue si aplica). `playMatch.ts` sustituye sus llamadas a `makeStubDuelInput`/`makeStubShotInput` por este adaptador.

**Justificación:** mantiene la separación "cards decide qué carta se jugó, match orquesta el reloj/posesión, duel/shot resuelven" — ningún módulo nuevo toca la fórmula de resolución.

## D6 — Compatibilidad con `playMatch` existente cuando no hay `cardEconomy`

**Decisión:** si `state.cardEconomy` es `undefined`, `playMatch` sigue exactamente el camino stub actual (fallback, no error). Esto preserva los ~40 tests existentes de `playMatch.golden.test.ts`, `momentumWiring.test.ts`, etc. de la 004 que construyen `MatchState` sin cartas.

**Justificación:** evita reescribir goldens de la 004 en la 005 (regla del proyecto: "un golden replay generado sobre código con un bug convierte el bug en el contrato" — aquí el caso inverso, no forzar un re-golden innecesario cuando el comportamiento previo sigue siendo válido para partidos sin sistema de cartas, p.ej. el harness de balance de 001-004). El harness de simulación (`tools/sim`) decide explícitamente en una tarea posterior si migra a `cardEconomy` real o sigue con stubs — fuera de alcance de la 005 salvo por CE-014 (verificar que las bandas no se mueven).

**Riesgo marcado:** este fallback es exactamente el tipo de "filtro defensivo que oculta un contrato roto" que el proyecto prohíbe (AGENTS.md §10) SI se usa para encubrir un caso que debería fallar. Aquí no aplica: es una feature-flag legítima de migración incremental (¿el estado trae `cardEconomy`, sí o no?), no una validación de un input que debería ser rechazado. Documentar explícitamente en el código por qué existe, para que no se lea como el patrón prohibido.

## D7 — Validación de precondición del suelo mínimo (RF-002)

**Decisión:** una función `assertDeckFloor(deck: SubDeck): void` que lanza (`throw`) si `attack.length < 14` o `defense.length < 8` al construir `CardEconomyState`. No es un filtro que rellena — es una aserción que grita, siguiendo la última regla de AGENTS.md §10 ("valida en la frontera y falla ruidosamente"). Vive en `cards/`, se llama una vez al crear el estado inicial de cartas de un partido.

**Justificación:** RF-002 dice explícitamente "fallar ruidosamente si no se cumple. No rellena" — coincide con la regla más reciente del proyecto sobre filtros defensivos.

## D8 — Zod en `packages/content`

**Decisión:** `CardSchema` en `packages/content/src/cards/schema.ts` sigue el esqueleto ya documentado en la skill `card-authoring` (id, nombre, categoria, potencia, atributoClave, rareza, costeEnergia, restriccion, fase, efectoId, efectoTexto), con el campo `fase` restringido para esta feature a los valores relevantes de v1 (`A`, `D`, `A/D`, `I`, `P`) — el esquema ya los cubre todos. Los "dobles de prueba" (RF: "usa el esquema y dobles de prueba") son fixtures Zod-válidos en `packages/content/src/cards/testFixtures.ts`, exportados solo para tests (no en el catálogo real, que es la 006 o posterior).

**Justificación:** la skill `card-authoring` ya es la fuente de verdad del esquema; no se reinventa. El catálogo real de 182 cartas está explícitamente fuera de alcance de la 005.

## D9 — Registro de handlers de efectos (RF-027, punto de extensión)

**Decisión:** `cards/effects/registry.ts` con la forma exacta del esqueleto de la skill (`Map<string, EffectHandler>`, `registerEffect`, `getEffect`), pero **vacío en v1** — ningún `efectoId` real se registra. `getEffect` devuelve un handler `identity` por defecto. Se acompaña de un test de no-implementación (mismo patrón que `transitionBonus`/`zoneBoost` de la 004): confirma que el registro existe, está vacío, y `getEffect('cualquier-id')` devuelve el handler identidad — así cablear el primer efecto real rompe el test visiblemente.

**Justificación:** exactamente el patrón ya validado en la 004 para puntos de extensión declarados-pero-no-consumidos (lección en AGENTS.md §10).

## D10 — Determinismo del set del portero

**Decisión:** el set del portero no usa `Rng` en absoluto — es una función pura `regenerateGoalkeeperSet(attributes: GoalkeeperAttributes): GoalkeeperSet` que evalúa los 4 umbrales de atributo (Handling≥13, Aerial Reach≥15, Reflexes≥15, One on Ones≥17) y devuelve siempre el mismo resultado para los mismos atributos. No hay aleatoriedad que consumir (RF-013).

**Justificación:** el manual y la spec no mencionan ningún elemento aleatorio en la regeneración del set — es determinista por construcción, sin necesitar PRNG.
