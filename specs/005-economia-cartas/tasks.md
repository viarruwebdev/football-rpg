# Tasks: Economía de cartas (spec 005)

**Input**: `specs/005-economia-cartas/` — spec.md, plan.md, research.md, data-model.md, contracts/cards-module.md
**Branch**: `005-economia-cartas`
**Approach**: Test-first (TDD). Los tests deben estar en rojo antes de escribir la implementación que los pone en verde.

---

## Orden de dependencias entre fases

```
Phase 1 (Zod + tipos)
  → Phase 2 (shuffle, deck — propiedades de conservación)
    → Phase 3 (hand, play, canConvert/convertCard/improvise)
      → Phase 4 (adapter — DuelSide/ShotSide)
        → Phase 5 (retreat, goalkeeper)
          → Phase 6 (effects registry — vacío v1)
            → Phase 7 (integración playMatch + golden)
              → Phase 8 (BDD feature + pulido)
```

Dentro de cada fase: **tests primero, implementación después**. Los tests marcados `[P]` dentro de la misma fase pueden escribirse en paralelo porque tocan archivos distintos.

---

## Phase 1: Fundación — esquema Zod + tipos compartidos

**Propósito**: Crear las entidades tipadas que todas las fases siguientes importan. Sin tests propios de tipos (TypeScript los valida), pero incluye tests de esquema Zod.

- [x] T001 Crear `packages/content/src/cards/schema.ts` con `CardSchema` (Zod): campos `id`, `nombre`, `categoria`, `potencia` (int 0-10), `atributoClave`, `rareza` ('Base'|'Avanzada'|'Élite'), `costeEnergia`, `restriccion` (nullable), `fase` ('A'|'D'|'A/D'|'I'|'P'), `efectoId`, `efectoTexto`. Exportar `Card = z.infer<typeof CardSchema>`. Definir también `GoalkeeperCardSchema` (id, nombre, potencia, atributoClave, umbral nullable, umbralAtributo nullable) y `GoalkeeperCardData = z.infer<...>`.

- [x] T001b Crear `packages/content/src/cards/goalkeeperCards.ts` con las **cinco cartas del portero como datos Zod** (F1 — Principio 4): Parada básica (pot. 3, umbral null), Blocaje (pot. 4, Handling ≥13), Despeje de puños (pot. 4, Aerial Reach ≥15), Estirada (pot. 5, Reflexes ≥15), Achique (pot. 6, One on Ones ≥17). Exportar `goalkeeperCards: GoalkeeperCardData[]`. Ni potencias ni umbrales viven en `packages/core`.

- [x] T002 Crear `packages/content/src/cards/testFixtures.ts` con al menos 6 dobles de prueba Zod-válidos: 2 cartas de ataque (potencias 3 y 5), 2 de defensa (potencias 2 y 4), 1 compartida (instante), 1 de utilidad pura (potencia 0). Exportar `testCards` y helpers `attackCard`, `defenseCard`, `sharedCard`, `zeroPowerCard`.

- [x] T003 [P] Crear `packages/content/src/cards/__tests__/schema.test.ts`: (a) fixture válido pasa `CardSchema.parse`; (b) potencia fuera de rango (−1, 11) lanza; (c) fase no reconocida lanza; (d) `zeroPowerCard` (potencia 0) es válida — no es error de schema.

- [x] T004 [P] Crear `packages/content/src/cards/index.ts` re-exportando `CardSchema`, `Card`, `GoalkeeperCardSchema`, `GoalkeeperCardData`, `goalkeeperCards`, `testCards` y helpers. Actualizar `packages/content/src/index.ts` añadiendo `export * from './cards'`.

- [x] T005 Crear `packages/core/src/cards/types.ts` con todas las interfaces del data-model: `CardInstance` (`{instanceId: string, card: PlayedCardSource}` — F5, identidad de instancia), `SubDeck` (`cards: CardInstance[]`), `Hand` (`cards: CardInstance[]`), `GoalkeeperAttributes`, `GoalkeeperCardId`, `GoalkeeperSet` (`available: GoalkeeperCardData[]`), `CardEconomyState`, `ImprovisedIntent`, `PlayedCard` (discriminated union `natural | converted | improvised`), `Instant`. Importar `Card` (como `PlayedCardSource`) y `GoalkeeperCardData` desde `@football-rpg/content`. No exportar implementación, solo tipos.

- [x] T006 Añadir `cardEconomy?: CardEconomyState` en `packages/core/src/match/types.ts` (campo opcional en `MatchState`, mismo patrón que `teamProfiles?`). Importar `CardEconomyState` desde `../cards/types`.

**Checkpoint Phase 1**: `pnpm type` en verde. Schema Zod válido con dobles de prueba.

---

## Phase 2: Barajado + construcción de estado (US1 — agotamiento)

**Propósito**: Fisher-Yates determinista y `createCardEconomyState`. Las propiedades de conservación arrancan aquí.

### Tests (escribir primero — deben fallar)

- [x] T007 [P] [US1] Crear `packages/core/src/cards/__tests__/shuffle.test.ts`:
  - (a) `shuffleDeck(cards, rng)` con semilla 42 produce el mismo orden dos veces (determinismo).
  - (b) El resultado es una permutación: mismas cartas, distinto orden posible (property: `fc.array` de ids, resultado contiene exactamente los mismos ids).
  - (c) No muta el array de entrada.

- [x] T008 [P] [US1] Crear `packages/core/src/cards/__tests__/deck.test.ts`:
  - (a) `assertDeckFloor` lanza si `attack.cards.length < 14` o `defense.cards.length < 8`.
  - (b) `createCardEconomyState` con decks válidos devuelve estado donde cada sub-mazo tiene el orden correcto (determinista por semilla).
  - (c) `createCardEconomyState` distribuye mano inicial: 5 ofensivas + 2 defensivas = 7 cartas (contar por filtro sobre `hand.cards` según `instance.card.fase`, no un campo separado).
  - (d) Tras `createCardEconomyState`: `deck.attack.cards.length + (cartas de fase 'A' en hand.cards) = tamaño original del mazo de ataque` (conservación por fase; contar con `hand.cards.filter(i => i.card.fase === 'A').length`, NO un campo `hand.attackCards` inexistente — F4).
  - (e) Cada `CardInstance` tiene `instanceId` único y determinista (`${card.id}#${índice}`); dos copias del mismo `card.id` tienen `instanceId` distintos (F5).

- [x] T009 [US1] Crear `packages/core/src/cards/__tests__/conservation.test.ts` — **property tests de conservación** (fast-check), expresados sobre el **multiset de `instanceId`** (F5 — es lo que hace CE-002 verificable):
  - **P1 (conservación total):** para cualquier secuencia de robo/juego/descarte, el multiset de `instanceId` en `(attack ∪ defense ∪ shared ∪ hand ∪ jugadas)` es igual al multiset inicial. Recolectar todos los `instanceId` de las tres estructuras + el registro de jugadas y comparar el multiset (no solo `.length`).
  - **P2 (mano acotada):** tras cualquier secuencia de robo, `hand.cards.length <= 7` siempre.
  - **P3 (no reaparición):** todo `instanceId` presente en el registro de jugadas NO aparece en ningún `SubDeck` ni `Hand` en ningún estado posterior. Directo gracias a `instanceId` — una carta descartada (mismo `card.id`, distinto `instanceId`) NO cuenta como reaparición de la jugada.
  - Usar `testCards` de T002 como árbitro. Estas tres properties son el criterio de éxito principal de la feature. Sin `CardInstance` (F5) P1/P3 no serían expresables: dos copias del mismo `card.id` de catálogo serían indistinguibles.

### Implementación

- [x] T010 [US1] Crear `packages/core/src/cards/shuffle.ts`: función `shuffleDeck<T>(cards: readonly T[], rng: Rng): T[]` — Fisher-Yates in-place sobre copia, usando `rng.next()` para cada swap. No usa `Math.random`. No muta entrada.

- [x] T011 [US1] Crear `packages/core/src/cards/deck.ts`: `assertDeckFloor`, `createCardEconomyState`. Envuelve cada `Card` en un `CardInstance` con `instanceId = \`${card.id}#${índice}\`` calculado sobre el **orden original antes de barajar** (F5 — así la identidad no depende del barajado); luego baraja los 3 sub-mazos con un `rng.split()` por sub-mazo (D3, research.md), reparte mano inicial, inicializa `mulliganUsedThisPossession` y `retreatUsedThisPossession` a false, llama `regenerateGoalkeeperSet`. `drawOnPossessionChange`: ambos equipos roban a la vez (RF-010); robar de sub-mazo agotado no falla (RF-006).

**Checkpoint Phase 2**: T007–T009 en rojo antes de T010–T011. Tras implementar: los tres property tests en verde.

---

## Phase 3: Mano, descarte, mulligan y jugadas (US1 + US3)

**Propósito**: Operaciones sobre la mano. Las propiedades de conservación se mantienen.

### Tests (escribir primero — deben fallar)

- [x] T012 [P] [US1] Crear `packages/core/src/cards/__tests__/hand.test.ts`:
  - (a) `discardToLimit` con mano de 9: descarta las 2 elegidas al fondo de su sub-mazo, mano queda en 7.
  - (b) `discardToLimit` con mano ≤ 7: no cambia nada.
  - (c) `mulligan`: descarta ≤2, roba 2 del sub-mazo de la fase, mano no crece.
  - (d) `mulligan` con 1 carta en sub-mazo: roba 1 (no falla).
  - (e) Segundo `mulligan` en la misma posesión: lanza (flag `mulliganUsedThisPossession`).

- [x] T013 [P] [US3] Crear `packages/core/src/cards/__tests__/play.test.ts`:
  - (a) `playCard` devuelve `PlayedCard` con `kind: 'natural'` y elimina la carta de la mano.
  - (b) `canConvert(zeroPowerCard)` es `false`; `canConvert(card potencia 2)` es `true`.
  - (c) `convertCard(carta potencia 4, 'Tackling')` devuelve `{kind:'converted', effectivePower: 2, naturalAttribute: 'Tackling'}`.
  - (d) `convertCard(carta potencia 3, 'Passing')` → `effectivePower: 1`.
  - (e) `convertCard(carta potencia 1, 'Passing')` **lanza** (bug del llamador).
  - (f) `convertCard(carta potencia 0, 'Passing')` **lanza** (bug del llamador — potencia 0 existe en el schema).
  - (g) `improviseCard('defense', 'tackle')` → `{kind:'improvised', power:0, intent:'tackle', naturalAttribute:'Tackling'}`.
  - (h) `improviseCard('attack', 'shot')` → `naturalAttribute: 'Finishing'`.
  - (i) `improviseCard('attack', 'cross')` → `naturalAttribute: 'Crossing'`.
  - (j) `improviseCard('midfield', 'pass')` → `naturalAttribute: 'Passing'`.
  - (k) `improviseCard('defense', 'cross')` **lanza** (intención ilegal en franja).
  - (l) `improviseCard('area', 'tackle')` **lanza** (intención ilegal en franja).

### Implementación

- [x] T014 [US1] Crear `packages/core/src/cards/hand.ts`: `discardToLimit(state, side, chosen)`, `mulligan(state, side, discarded)`. Descartar = añadir al fondo del sub-mazo correspondiente (por `fase` de la carta → `attack`/`defense`/`shared`). Validar `mulliganUsedThisPossession`; lanzar si ya usado.

- [x] T015 [US3] Crear `packages/core/src/cards/play.ts`: `playCard`, `canConvert`, `convertCard` (lanza si `card.potencia < 2`), `improviseCard`. Tabla de atributos por zona×intención según RF-016 (6 filas). Validar intención legal en franja; lanzar si no.

**Checkpoint Phase 3**: T012–T013 en rojo antes de T014–T015. Tras implementar: `pnpm test -- cards/hand cards/play` verde.

---

## Phase 4: Adaptador PlayedCard → DuelSide / ShotSide (US1)

**Propósito**: El puente entre economía de cartas y los resolvedores existentes. RF-024/RF-025: `resolveDuel` y `resolveShot` no se tocan.

### Tests (escribir primero — deben fallar)

- [x] T016 [US1] Crear `packages/core/src/cards/__tests__/adapter.test.ts`:
  - (a) `cardToDuelSide({kind:'natural', card: carta potencia 5}, attr=14, composure=12, [])` → `{cardPower:5, attribute: influencia(14), modifiers:[], composure:12}`.
  - (b) `cardToDuelSide({kind:'converted', effectivePower:2, naturalAttribute:'Passing'}, attr=16, composure=10, [2])` → `cardPower:2`, `modifiers:[2]`.
  - (c) `cardToDuelSide({kind:'improvised', power:0, intent:'shot', naturalAttribute:'Finishing'}, attr=18, composure=10, [])` → `cardPower:0`, `attribute: influencia(18) = +4`.
  - (d) `cardToShotSide` para carta natural potencia 4 → `{cardPower:4, ...}`.
  - (e) CE-012 (reutilización): el módulo `cards/adapter.ts` no contiene `triangular`, `computeBand` ni `sampleTriangular` — test negativo con grep inline o importando solo tipos del módulo y verificando que no re-exporta nada de `duel/resolveDuel` ni `shot/resolveShot`.

### Implementación

- [x] T017 [US1] Crear `packages/core/src/cards/adapter.ts`: `cardToDuelSide(played, attribute, composure, extraModifiers): DuelSide` y `cardToShotSide(played, attribute, composure, extraModifiers): ShotSide`. Usa `attributeToInfluence` de `../duel` para convertir atributo bruto a influencia. `extraModifiers` se pasa directamente al array `modifiers` (el llamador — `playMatch` — los compone igual que hoy hace `buildSituationalModifiers`). No llama a `resolveDuel` ni `resolveShot`.

**Checkpoint Phase 4**: T016 en rojo antes de T017. Verificar con `grep -rn "triangular\|computeBand\|sampleTriangular" packages/core/src/cards/` → vacío.

---

## Phase 5: Repliegue y portero (US1 + US4)

**Propósito**: `applyRetreat` y el set del portero determinista (sin Rng).

### Tests (escribir primero — deben fallar)

- [x] T018 [P] [US1] Crear `packages/core/src/cards/__tests__/retreat.test.ts`:
  - (a) `applyRetreat` con mano de 1 carta: devuelve estado con `retreatUsedThisPossession[side]=true`, mano vacía.
  - (b) `applyRetreat` con mano vacía: **lanza** (RF-021).
  - (c) Segundo `applyRetreat` en la misma posesión: **lanza** (RF-020, máx. 1 por posesión).
  - (d) El +2 NO se aplica en `applyRetreat` — el estado devuelto no tiene ningún campo de bonus; el +2 lo añade el llamador en `extraModifiers` de `cardToDuelSide`.

- [x] T019 [P] [US4] Crear `packages/core/src/cards/__tests__/goalkeeper.test.ts`:
  - (a) `regenerateGoalkeeperSet({reflexes:16, handling:10, aerialReach:10, oneOnOnes:10})` → set con Parada básica + Estirada (Reflexes ≥15), sin Blocaje ni Despeje ni Achique.
  - (b) `regenerateGoalkeeperSet({reflexes:10, handling:10, aerialReach:10, oneOnOnes:10})` → solo Parada básica.
  - (c) `regenerateGoalkeeperSet({reflexes:16, handling:14, aerialReach:16, oneOnOnes:18})` → las 5 cartas.
  - (d) `useGoalkeeperCard(set, 'estirada')` cuando disponible → devuelve `{set: setActualizado, card}`.
  - (e) `useGoalkeeperCard(set, 'estirada')` segunda vez en la misma posesión → `null` (CE-008).
  - (f) `useGoalkeeperCard(set, 'parada-basica')` ilimitado: nunca devuelve null (RF-014).
  - (g) `regenerateGoalkeeperSet` no usa `Rng` — determinista puro por atributos (D10).
  - (h) Las potencias y umbrales provienen de `goalkeeperCards` (content), no de constantes en `goalkeeper.ts` — F1/Principio 4. Verificar con grep negativo: `goalkeeper.ts` no contiene los literales `13`, `15`, `17` de umbral ni `3`/`4`/`5`/`6` de potencia (todos vienen de los datos).

### Implementación

- [x] T020 [US1] Crear `packages/core/src/cards/retreat.ts`: `applyRetreat(state, side, spentCard)`. Lanza si mano vacía o `retreatUsedThisPossession[side]` ya activo. Devuelve estado con la carta eliminada de la mano y el flag activado. El +2 es responsabilidad del llamador (no de esta función).

- [x] T021 [US4] Crear `packages/core/src/cards/goalkeeper.ts`: `regenerateGoalkeeperSet(attrs)` — itera `goalkeeperCards` (importado de `@football-rpg/content`, F1), incluye cada carta cuyo `umbral` es `null` (Parada básica) o cuyo `attrs[umbralAtributo] >= umbral`; `usedThisPossession = new Set()`. `useGoalkeeperCard(set, id)` — devuelve `null` si `id !== 'parada-basica'` y `usedThisPossession.has(id)`; si no, devuelve carta y actualiza el set. **Ninguna potencia ni umbral hardcodeado** — todo viene de los datos.

- [x] T022 [US1] Crear `packages/core/src/cards/crushingDraw.ts`: `drawOnCrushingSuccess(state, side)` — roba 1 carta del sub-mazo de la fase del lado ganador (RF-012/CE-011). Robar de agotado no falla (RF-006).

**Checkpoint Phase 5**: T018–T019 en rojo antes de T020–T022.

---

## Phase 6: Registro de efectos vacío (RF-027 — punto de extensión)

**Propósito**: El mismo patrón que `transitionBonus`/`zoneBoost` de la 004: declarar el punto de extensión con un test que lo pinea como vacío en v1.

### Tests (escribir primero — deben fallar)

- [x] T023 [US1] Crear `packages/core/src/cards/__tests__/notYetImplemented.test.ts`:
  - (a) `getEffect('cualquier-id')` devuelve el handler identidad (no lanza, no aplica nada).
  - (b) `getEffect('amague')`, `getEffect('vision-periferica')` → mismo resultado que `getEffect('id-inexistente')`.
  - (c) El registro está vacío: ningún `id` registrado produce un handler distinto del identidad.
  - Comentario explícito: "Este test debe romperse visiblemente cuando se cablee el primer efecto real. Actualizar a propósito."

### Implementación

- [x] T024 [US1] Crear `packages/core/src/cards/effects/registry.ts`: `Map<string, EffectHandler>` vacío. `registerEffect(id, handler)`, `getEffect(id)` (devuelve handler identidad si no registrado). `EffectHandler = (state: CardEconomyState) => CardEconomyState`.

**Checkpoint Phase 6**: T023 en rojo antes de T024. Tras implementar: el test pinea el comportamiento vacío.

---

## Phase 7: Barrel + integración con playMatch (US1 — sustitución de stubs)

**Propósito**: Conectar el módulo `cards/` al orquestador. Sustituir `makeStubDuelInput`/`makeStubShotInput`. El test de no-implementación de la 004 debe romperse al cablear `drawOnCrushingSuccess`.

### Tests (escribir primero — deben fallar)

- [x] T025 [US1] Crear `packages/core/src/cards/__tests__/integration.test.ts`:
  - (a) `playMatch` con `state.cardEconomy` poblado (usando `testCards` de T002 + `createCardEconomyState`) produce un log de eventos sin errores y consume cartas reales en cada duelo — verificar que `state.cardEconomy.hands` tiene menos cartas al final que al inicio.
  - (b) `playMatch` sin `cardEconomy` (undefined) sigue funcionando igual que en la 004 — fallback al comportamiento stub (CE-006 de compatibilidad hacia atrás, D6 research.md). Los tests golden de la 004 no deben romperse.
  - (c) CE-014 (calibración): ejecutar N=50 partidos con `testCards` y semilla determinista; verificar que la media de goles cae en [2.0, 4.5]. Si se desvía, registrar el valor antes de tocar constantes.

- [x] T026 [US1] Verificar que el test de no-implementación de la 004 rompe al cablear `drawOnCrushingSuccess`:
  - Leer `packages/core/src/match/__tests__/possession.test.ts` — el test "NOT YET IMPLEMENTED (RF-019/RF-020)" del `crushingAdvance` está actualmente en verde porque `drawsCard` no está cableado.
  - Cablear `drawOnCrushingSuccess` en `playMatch` en la rama `crushingAdvance`.
  - El test de posesión DEBE ponerse en rojo. Actualizar el test a propósito para reflejar el comportamiento real (CE-011).

### Implementación

- [x] T027 [US1] Crear `packages/core/src/cards/index.ts` — barrel exportando todo lo público según `contracts/cards-module.md`: `createCardEconomyState`, `assertDeckFloor`, `drawOnPossessionChange`, `discardToLimit`, `mulligan`, `playCard`, `canConvert`, `convertCard`, `improviseCard`, `cardToDuelSide`, `cardToShotSide`, `applyRetreat`, `regenerateGoalkeeperSet`, `useGoalkeeperCard`, `drawOnCrushingSuccess`, `registerEffect`, `getEffect`. Re-exportar `CardEconomyState` y tipos relacionados desde `./types`.

- [x] T028 [US1] Modificar `packages/core/src/match/playMatch.ts`:
  - Eliminar `makeStubDuelInput` y `makeStubShotInput` (o convertirlas en fallback interno solo cuando `state.cardEconomy === undefined`).
  - Cuando `cardEconomy` está presente: usar `cardToDuelSide`/`cardToShotSide` con la carta jugada desde la mano. **Política de selección placeholder (F2):** la carta de **mayor potencia disponible de la fase actual** (determinista; empate → menor `instanceId`). No "la primera disponible": ese orden está sesgado por el barajado y CE-014 mediría un juego que nadie juega. "Mayor potencia" es lo que haría un jugador racional por defecto y hace CE-003 (agotamiento) realista — quemas las buenas primero. Comentar en el código: `// PLACEHOLDER — sustituible por la IA de decisión (RF-027). Vive en playMatch, NO en cards/.`
  - Cablear `drawOnCrushingSuccess` en la rama `crushingAdvance` de `applyTransition`.
  - Cablear `drawOnPossessionChange` al abrir cada nueva posesión.
  - Cablear `regenerateGoalkeeperSet` al inicio de cada posesión defensiva.
  - `makeStubShotInput` ya no hardcodea `shotZone: 'area'` — ahora la zona viene del `strip` actual de la posesión.

- [x] T029 [US1] Actualizar el test de no-implementación en `packages/core/src/match/__tests__/possession.test.ts`: cambiar el comentario "NOT YET IMPLEMENTED" a "IMPLEMENTED (RF-012/CE-011)" y actualizar la aserción para verificar que `drawOnCrushingSuccess` sí se invoca (o que el estado de cartas cambia tras un `crushingAdvance`).

**Checkpoint Phase 7**: `pnpm test` completo en verde. Verificar CE-012: `grep -rn "triangular\|computeBand\|sampleTriangular" packages/core/src/cards/` → vacío. Verificar CE-013: `git diff main...HEAD -- packages/core/src/duel/resolveDuel.ts packages/core/src/shot/resolveShot.ts` → vacío.

---

## Phase 8: BDD feature + pulido final

**Propósito**: Criterios de aceptación en Gherkin y cierre de calidad.

- [x] T030 Crear `features/005-economia-cartas.feature` con escenarios BDD para las cuatro historias de usuario (semilla fija en cada escenario):
  - **Historia 1:** Dado un estado con mazo de ataque de 14 cartas, cuando se juegan N posesiones atacantes, entonces el mazo se vacía y el equipo improvisa.
  - **Historia 2:** Dado una mano de 5 cartas y un robo de 3, cuando se excede el límite, entonces la mano queda en 7 tras el descarte elegido.
  - **Historia 3:** Dado un mazo ofensivo vacío, cuando el jugador improvisa con Finishing 18, entonces la fuerza resultante es 4 (potencia 0 + influencia +4).
  - **Historia 4:** Dado un portero con Reflexes 16 y One on Ones 18, cuando defiende dos remates consecutivos, entonces el segundo remate solo dispone de Parada básica.

- [x] T031 [P] Ejecutar `pnpm type && pnpm check` y corregir cualquier error de tipos o formato (Biome). Prioridad: `packages/core/src/cards/` y los archivos modificados de `match/`.

- [x] T032 [P] Ejecutar `pnpm sim` y registrar las bandas de calibración resultantes con cartas reales vs stubs. Si la media de goles sale de [2.0, 4.5], diagnosticar antes de tocar constantes (CE-014): comparar `cardPower` de `testCards` con el `DEFAULT_PROFILE.cardPower = 5` de los stubs.

- [x] T033 Actualizar `packages/content/src/index.ts` y `packages/core/src/index.ts` con los nuevos exports si alguno falta tras las fases anteriores.

**Checkpoint Final**: `pnpm type && pnpm check && pnpm test && pnpm sim` en verde con bandas intactas.

---

## Dependencies & Execution Order

### Entre fases (secuencial obligatorio)
- Phase 1 → Phase 2 (tipos necesarios para deck/shuffle)
- Phase 2 → Phase 3 (estado necesario para hand/play)
- Phase 3 → Phase 4 (PlayedCard necesario para adapter)
- Phase 4 → Phase 5 (adapter necesario para integración retreat)
- Phase 5 → Phase 6 (estado completo necesario para EffectHandler)
- Phase 6 → Phase 7 (todos los módulos deben existir para el barrel)
- Phase 7 → Phase 8 (integración completa antes de BDD)

### Dentro de cada fase
- Tests `[P]` dentro de una fase: pueden escribirse en paralelo (ficheros distintos).
- Implementación: siempre después de que los tests estén en rojo.

### Parallel dentro de fases
```
Phase 2: T007 ∥ T008 → T009 → T010 → T011
Phase 3: T012 ∥ T013 → T014 ∥ T015
Phase 5: T018 ∥ T019 → T020 ∥ T021 ∥ T022
Phase 8: T031 ∥ T032 (después de T030)
```

---

## Invariantes de conservación — cómo verificarlos

Las tres propiedades del enunciado (T009) son la columna vertebral de los tests:

| Propiedad | Test | Tipo | Criterio de fallo |
|-----------|------|------|-------------------|
| Total constante (CE-002) | T009-P1 | property (fast-check) | multiset de `instanceId` en `(mazo+mano+jugadas)` ≠ multiset inicial |
| Mano ≤ 7 (CE-005) | T009-P2 | property (fast-check) | `hand.cards.length > 7` en cualquier estado |
| No reaparición (CE-002) | T009-P3 | property (fast-check) | un `instanceId` jugado aparece en algún `SubDeck` o `Hand` |

Para **P1** y **P3** (F5): la unidad es `instanceId`, no `card.id` de catálogo. `instanceId = \`${card.id}#${índice}\`` se genera al construir el mazo (T011). Dos copias del mismo `card.id` tienen `instanceId` distintos, así que una descartada (que vuelve al fondo) nunca se confunde con una jugada (que sale del juego). Sin `CardInstance`, CE-002 no sería expresable.

---

## Implementation Strategy

### MVP (Phase 1–4)
Completar hasta el adaptador inclusive. En este punto el módulo `cards/` tiene tipos, shuffle determinista, estado de mano con propiedades de conservación verificadas, y el puente a los resolvedores. No hay integración con `playMatch` aún, pero todo lo demás es testeable de forma aislada.

### Incremento 1 (Phase 5–6)
Añadir portero y repliegue. Completar el módulo sin tocar `playMatch`.

### Incremento 2 (Phase 7–8)
Integrar con `playMatch`, cablear `drawOnCrushingSuccess`, generar BDD, verificar calibración.

---

## Notes

- `[P]` = archivos distintos, sin dependencias entre sí dentro de la misma fase.
- `[US1]` = Historia 1 (agotamiento) o infraestructura compartida. `[US3]` = Historia 3 (jugar sin cartas). `[US4]` = Historia 4 (portero).
- T009 (property tests de conservación) es el test más importante de la feature. Si falla, todo lo demás es sospechoso.
- T026/T029 son el contrato con la 004: el test de no-implementación debe ponerse rojo al cablear `drawOnCrushingSuccess`, y actualizarse a propósito — no silenciosamente.
- CE-013 no es un test de Vitest — es un `git diff`. Ejecutarlo manualmente antes de cerrar la PR.

## Trazabilidad RF → tarea (F3)

| RF | Tarea(s) | RF | Tarea(s) |
|----|----------|----|----------|
| RF-001 | T002, T011 | RF-015 | T001b, T019, T021 |
| RF-002 | T008a, T011 | RF-016 | T013g-l, T015 |
| RF-003 | T007, T010, T011 | RF-017 | T013c-d, T015 |
| RF-004 | T009-P1/P3 | RF-018 | T013e-f, T015 |
| RF-005 | T012a, T014 | RF-019 | T012, T015 (instantes) |
| RF-006 | T011, T022 | RF-020 | T018c, T020 |
| RF-007 | T009-P2, T012 | RF-021 | T018b, T020 |
| RF-008 | T008c, T011 | RF-022 | T028 |
| RF-009 | T012a, T014 | RF-023 | T025, T009-P1 |
| RF-010 | T011 (`drawOnPossessionChange`) | RF-024 | T017 (adapter, no reimpl) |
| RF-011 | T012c-e, T014 | RF-025 | T016e, checkpoint P7 (git diff) |
| RF-012 | T022, T026, T029 | RF-026 | T001, T003, T004 |
| RF-013 | T019, T021 | RF-027 | T023, T024, T028 (placeholder) |
| RF-014 | T019f, T021 | | |

CE-001↔T007/T025 · CE-002↔T009-P1/P3 · CE-003/004↔T032 (sim) · CE-005↔T009-P2 · CE-006/007↔T013 · CE-008↔T019e · CE-009↔T018d · CE-010↔T016c · CE-011↔T026/T029 · CE-012↔T016e · CE-013↔checkpoint P7 · CE-014↔T025c/T032.
